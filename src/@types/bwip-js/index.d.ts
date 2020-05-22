declare module "bwip-js" {
  export interface IFontLib {
    lookup: (arg0: any) => any;
    getpaths: (arg0: any, arg1: any, arg2: number, arg3: number) => any;
  }

  export const FontLib: IFontLib;

  export function fixupOptions(opts: ToBufferOptions): void;

  export function render(opts: ToBufferOptions, drawing: any): string;

  export function toBuffer(
    opts: ToBufferOptions,
    callback: (err: string | Error, png: Buffer) => void
  ): void;

  interface ToBufferOptions {
    bcid: string;
    text: string;

    parse?: boolean;
    parsefunc?: boolean;

    height?: number;
    width?: number;

    scaleX?: number;
    scaleY?: number;
    scale?: number;

    rotate?: "N" | "R" | "L" | "I";

    paddingwidth?: number;
    paddingheight?: number;
    paddingleft?: number;
    paddingright?: number;
    paddingtop?: number;
    paddingbottom?: number;

    monochrome?: boolean;
    alttext?: boolean;

    includetext?: boolean;
    textfont?: string;
    textsize?: number;
    textgaps?: number;

    textxalign?:
      | "offleft"
      | "left"
      | "center"
      | "right"
      | "offright"
      | "justify";
    textyalign?: "below" | "center" | "above";
    textxoffset?: number;
    textyoffset?: number;

    showborder?: boolean;
    borderwidth?: number;
    borderleft?: number;
    borderright?: number;
    bordertop?: number;
    boraderbottom?: number;

    barcolor?: string;
    backgroundcolor?: string;
    bordercolor?: string;
    textcolor?: string;

    addontextxoffset?: number;
    addontextyoffset?: number;
    addontextfont?: string;
    addontextsize?: number;

    guardwhitespace?: boolean;
    guardwidth?: number;
    guardheight?: number;
    guardleftpos?: number;
    guardrightpos?: number;
    guardleftypos?: number;
    guardrightypos?: number;

    sizelimit?: number;

    includecheck?: boolean;
    includecheckintext?: boolean;

    inkspread?: number;
    inkspreadh?: number;
    inkspreadv?: number;
  }
}
