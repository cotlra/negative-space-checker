export type PropType =
  | "paddingTop"
  | "paddingBottom"
  | "paddingLeft"
  | "paddingRight"
  | "itemSpacing"
  | "counterAxisSpacing";

export type PropInfo = {
  type: PropType;
  value: number;
  nodeId: string;
  nodeName: string;
};
