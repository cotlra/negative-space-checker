import { PropInfo,PropType } from "./prop_info";

let paddingInfoArray: PropInfo[] = [];
let itemSpacingInfoArray: PropInfo[] = [];

function clearArray():void {
  paddingInfoArray = [];
  itemSpacingInfoArray = [];
}

function createInfo(type:PropType,value: number, node: SceneNode):PropInfo {
  return {type, value, nodeId:node.id, nodeName:node.name};
}

function scanProperty(nodes:ReadonlyArray<SceneNode>): void {
  for(const node of nodes) {
    const variablesOfNode = node.boundVariables;
    if(node.type == 'FRAME'){
        if(node.layoutMode == 'HORIZONTAL' || node.layoutMode == 'VERTICAL') {
          if(!variablesOfNode?.paddingTop){
            paddingInfoArray.push(createInfo('paddingTop', node.paddingTop, node));
          }
          if(!variablesOfNode?.paddingBottom){
            paddingInfoArray.push(createInfo('paddingBottom', node.paddingBottom, node));
          }
          if(!variablesOfNode?.paddingLeft){
            paddingInfoArray.push(createInfo('paddingLeft', node.paddingLeft, node));
          }
          if(!variablesOfNode?.paddingRight){
            paddingInfoArray.push(createInfo('paddingRight', node.paddingRight, node));
          }
          if(!variablesOfNode?.itemSpacing){
            itemSpacingInfoArray.push(createInfo('itemSpacing', node.itemSpacing, node));
          }
          if(!node.counterAxisSpacing && !variablesOfNode?.counterAxisSpacing){
            itemSpacingInfoArray.push(createInfo('counterAxisSpacing', node.counterAxisSpacing as number, node));
          }
        }
    }
    if("children" in node){
      scanProperty(node.children);
    }
  }
}


function scanAll(nodes:ReadonlyArray<SceneNode>):void{
  clearArray();
  scanProperty(nodes);
  figma.ui.postMessage({
    type: 'scan-result',
    paddingInfo:getValuesAndCount(paddingInfoArray),
    itemSpacingInfo:getValuesAndCount(itemSpacingInfoArray),
  });
}

function getValuesAndCount(infoArray: PropInfo[]):({value:number,count:number})[]{
  const result:({value:number,count:number})[] = [];
  const values = [...new Set(infoArray.map(info => info.value))];
  for(const value of values) {
    const ids = infoArray.filter(info => info.value === value).map(info => info.nodeId);
    result.push({
      value: value,
      count: [...new Set(ids)].length,
    });
  }
  return result;
}

figma.showUI(__html__, { width: 300, height: 400 });

figma.ui.onmessage = async  (msg: {type: string,propertyName:string|undefined,value: number|undefined}) => {
  if (msg.type === 'scan-page') {
    const pageChildren: ReadonlyArray<SceneNode> = figma.currentPage.children;
    if(pageChildren.length <= 0) {
      figma.notify('This page is no object.');
    }
    scanAll(pageChildren);

  } else if (msg.type === 'scan-selected'){
    const selection: ReadonlyArray<SceneNode> = figma.currentPage.selection;
    if(selection.length <= 0) {
      figma.notify('Please select at least one object.');
    }
    scanAll(selection);

  }else if (msg.type === 'select-nodes') {
    let infoArray: PropInfo[] = [];
    if(msg.propertyName === 'padding'){
      infoArray = paddingInfoArray;
    }else if(msg.propertyName === 'item-spacing'){
      infoArray = itemSpacingInfoArray;
    }
    const nodeIds = [...new Set(infoArray.filter(info => info.value === msg.value).map(info =>info.nodeId))];
    const selection:Array<SceneNode> = [];
    for(const id of nodeIds) {
      const node = await figma.getNodeByIdAsync(id);
      if(node && node.type !== 'PAGE' && node.type !== 'DOCUMENT') {
        selection.push(node as SceneNode);
      }
    }
    figma.currentPage.selection = selection;
    figma.viewport.scrollAndZoomIntoView(selection);
  }
};


