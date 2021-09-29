import { StateEnums, isString, move } from './util.js';
import Element from './element.js';

export default function diff (oldDomTree, newDomTree) {
  // 记录差异
  let patchs = {};
  dfs(oldDomTree, newDomTree, 0, patchs);

  return patchs;
}

function dfs (oldNode, newNode, index, patches) {
  // 保存子树的更改
  const curPatches = [];

  // 判断三种情况
  // 1. 没有新节点，什么都不用做
  if (!newNode) {
    console.log('没有新的节点，无需操作');
  } else if (newNode.tagName === oldNode.tagName && newNode.key === oldNode.key) {
    // 3. 新节点的 tagName 和 key 和旧的相同, 遍历子树
    // 第三种情况
    // 判断属性是否变更
    const props = diffProps(oldNode.props, newNode.props);
    if (props.length) curPatches.push({ type: StateEnums.ChangeProps, props });
    // 遍历子树
    diffChildren(oldNode.children, newNode.children, index, patches);
  } else {
    // 2. 新节点的 tagName 和 key 和旧的不同，替换旧的节点
    // 第二种情况
    curPatches.push({ type: StateEnums.Replace, node: newNode });
  }

  if (curPatches.length) {
    if (patches[index]) {
      patches[index] = patches[index].concat(curPatches);
    } else {
      patches[index] = curPatches;
    }
  }
}

// 判断属性的更改
function diffProps (oldProps, newProps) {
  const change = [];

  //1. 判断 oldProps 是否存在删除的属性
  if (oldProps) {
    for (const key in oldProps) {
      if (oldProps.hasOwnProperty(key) && !newProps[key]) {
        change.push({
          prop: key
        });
      }
    }
  }

  //2. 判断 oldProps 中的属性与 newProps中的属性是否相同
  if (newProps) {
    for (const key in newProps) {
      if (oldProps[key] && newProps[key] !== oldProps[key]) {
        change.push({
          prop: key,
          value: newProps[key]
        });
      } else if (!oldProps[key]) {
        //3. 在第二步的时候判断是否有新属性不存在在旧属性中
        change.push({
          prop: key,
          value: newProps[key]
        })
      }
    }
  }

  return change;
}

function listDiff (oldList, newList, index, patches) {
  console.log('newList: ', newList);

  // 先去除所有节点的key
  const newKeys = getKeys(newList);
  const change = [];

  /*
  * 保留变更后的节点数据
  * 使用数组保存的好处
  * 方便获取被删除节点的索引
  * 便于交换节点位置时的操作
  * 用于 diffChildren 中的判断
  */  
  const list = [];

  // 1.遍历旧的节点列表，查看每个节点是否还存在于新的节点列表中
  oldList &&
    oldList.forEach(item => {
      let key = item.key;
      if (isString(item)) {
        key = item;
      }
      // 判断是否在新的节点中
      // 没有的话需要删除
      const index = newKeys.indexOf(key);
      if (index === -1) {
        list.push(null);
      } else {
        list.push(key);
      }
    })
  // 遍历变更后的数组
  const length = list.length;
  // 从后往前删除索引可以保证索引不变
  for (let i = length - 1; i >= 0; i --) {
    if (!list[i]) {
      list.splice(i, 1);
      change.push({
        type: StateEnums.Remove,
        index: i
      });
    }
  }

  // 2.遍历新的 list,判断是否有节点新增或移动
  // 3.在第二步时判断是否移动了节点,如果有，则进行新增或移动的操作
  newList &&
    newList.forEach((item, i) => {
      let key = item.key;
      if (isString(item)) key = item;
      // 判断是否在旧的 children 中
      const index = list.indexOf(key);
      // 没有找到新的节点，执行插入操作
      if (index === -1 || key == null) {
        change.push({
          type: StateEnums.Insert,
          node: item,
          index: i
        });
        // 将节点的 key 插入到 list 中
        list.splice(i, 0, key);
      } else {
        // 找到存在旧 children 中的节点，判断是否需要移动
        if (index !== i) {
          change.push({
            type: StateEnums.move,
            form: index,
            to: i
          });
          // 移动 list
          move(list, index, i);
        }
      }
    });

  return { change, list };
}

function getKeys (list) {
  const keys = [];

  list && 
    list.forEach(item => {
      let key;
      if (isString(item)) {
        key = [item];
      } else if (item instanceof Element) {
        key = item.key;
      }

      keys.push(key);
    });

  return keys;
}

function diffChildren (oldChild, newChild, index, patches) {
  // 判断两个列表的差异
  // 给节点打上标记
  const { changes, list } = listDiff(oldChild, newChild, index, patches);

  if (changes && changes.length) {
    if (patches[index]) {
      patches[index] = patches[index].concat(changes);
    } else {
      patches[index] = changes;
    }
  }

  // 记录上一个遍历的节点
  let last = null;
  oldChild &&
    oldChild.forEach((item, i) => {
      let child = item && item.children;
      if (child) {
        index = last && last.children ? index + last.children.length + 1 : index + 1;
        const keyIndex = list.indexOf(item.key);
        const node = newChild[keyIndex];

        if (node) {
          dfs(item, node, index, patches);
        }
      } else {
        index += 1;
      }

      last = item;
    });
}
