import patch from './patch.js';
import ElementClass from './element.js';
import diff from './main.js';

let test4 = new ElementClass('div', { class: 'my-div' }, ['test4'], 'test4');
let test5 = new ElementClass('div', { class: 'my-div' }, ['test5'], 'test5');

let test1 = new ElementClass('div', { class: 'my-div' }, [test4], 'test1');

let test2 = new ElementClass('div', { id: '11' }, [test5, test4, test1], 'test2');

let test3 = new ElementClass('div', {}, [
  new ElementClass('div', { color: 'red' }, ['first child']),
  new ElementClass('div', { color: 'green' }, ['last child'])
], 'test3');

let root = test1.render();

// 对比两个节点之间的差异
let patchs2 = diff(test1, test3);

setTimeout(() => {
  console.log('开始更新')
  patch(root, patchs2);
  console.log('结束更新')
}, 3000);