declare module "bwip-js" {
  export interface IFontLib {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getpaths: (arg0: any, arg1: any, arg2: number, arg3: number) => any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lookup: (arg0: any) => any;
  }

  export const FontLib: IFontLib;

  export function fixupOptions(opts: ToBufferOptions): void;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function render(opts: ToBufferOptions, drawing: any): string;

  export function toBuffer(
    opts: ToBufferOptions,
    callback: (err: Error | string, png: Buffer) => void,
  ): void;

  interface ToBufferOptions {
    addontextfont?: string;
    addontextsize?: number;

    addontextxoffset?: number;
    addontextyoffset?: number;

    alttext?: boolean;
    backgroundcolor?: string;

    barcolor?: string;
    bcid: string;
    boraderbottom?: number;

    bordercolor?: string;

    borderleft?: number;
    borderright?: number;
    bordertop?: number;
    borderwidth?: number;
    guardheight?: number;
    guardleftpos?: number;

    guardleftypos?: number;
    guardrightpos?: number;

    guardrightypos?: number;
    guardwhitespace?: boolean;
    guardwidth?: number;
    height?: number;

    includecheck?: boolean;
    includecheckintext?: boolean;
    includetext?: boolean;
    inkspread?: number;

    inkspreadh?: number;
    inkspreadv?: number;
    monochrome?: boolean;
    paddingbottom?: number;
    paddingheight?: number;
    paddingleft?: number;

    paddingright?: number;
    paddingtop?: number;
    paddingwidth?: number;
    parse?: boolean;

    parsefunc?: boolean;
    rotate?: "I" | "L" | "N" | "R";
    scale?: number;
    scaleX?: number;

    scaleY?: number;
    showborder?: boolean;
    sizelimit?: number;
    text: string;
    textcolor?: string;
    textfont?: string;
    textgaps?: number;

    textsize?: number;

    textxalign?:
      | "center"
      | "justify"
      | "left"
      | "offleft"
      | "offright"
      | "right";
    textxoffset?: number;

    textyalign?: "above" | "below" | "center";
    textyoffset?: number;
    width?: number;
  }
}
