import { StateEnums, isString } from './util.js';
import Element from './element.js';

let index = 0;
export default function patch (node, patchs) {
  let changes = patchs[index];
  let childNodes = node && node.childNodes;

  if (!childNodes) index += 1;
  if (changes && changes.length && patchs[index]) {
    changeDom(node, changes);
  }

  let last = null;

  if (childNodes && childNodes.length) {
    childNodes.forEach((item, i) => {
      index = last && last.children ? index + last.children.length + 1 : index + 1;

      patch(item, patchs);

      last = item;
    });
  }
}

function changeDom (node, changes, noChild) {
  changes &&
    changes.forEach(change => {
      let { type } = change;
      switch (type) {
        // 修改 props 操作
        case StateEnums.ChangeProps:
          let { props } = change;
          props.forEach(item => {
            console.log('item: ', item);
            if (item.value) {
              node.setAttribute(item.prop, item.value);
            } else {
              node.removeAttribute(item.prop);
            }
          })
          break;
        // 移除节点
        case StateEnums.Remove:
          node.childNodes[change.index].remove();
          break;
        // 插入节点
        case StateEnums.Insert:
          let dom;
          if (isString(change.node)) {
            dom = document.createTextNode(change.node);
          } else if (change.node instanceof Element) {
            dom = change.node.create();
          }

          node.inserBefore(dom, node.childNodes[change.index]);
          break;
        // 修改操作
        case StateEnums.Replace:
          node.parentNode.replaceChild(change.node.create(), node);
          break;
        // 移动操作
        case StateEnums.Move:
          let fromNode = node.childNodes[change.from];
          let toNode = node.childNodes[change.to];
          let cloneFromNode = fromNode.cloneNode(true);
          let cloneToNode = fromNode.cloneNode(true);

          node.replaceChild(cloneFromNode, toNode);
          node.replaceChild(cloneToNode, fromNode);
          break;
        default:
          break;
      }
    });
}