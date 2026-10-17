/**
 * Minimal, dependency-light XLSX (Office Open XML) writer with real styling.
 *
 * Pure TypeScript: no React Native, no DOM. The only dependency is `fflate` (already used by the phone app) for
 * the zip container, so the same file runs on the phone, in the browser and in Node tests.
 *
 * What it writes: styles.xml (fonts, fills, borders, number formats), shared strings, real date cells (serial
 * numbers + a date number format), live formulas with cached results, hyperlinks (relationships), merged cells,
 * frozen panes, autofilter, column widths, tab colours, zebra striping (conditional formatting so it survives
 * sorting), print setup (landscape, fit to width, repeat header rows) and document properties.
 *
 * Coordinates in this API are 0-based (row 0 / col 0 is cell A1).
 */
import { strToU8, zipSync } from "fflate";

export type HAlign = "left" | "center" | "right";
export type VAlign = "top" | "center" | "bottom";
export type BorderStyle = "thin" | "medium" | "hair" | "double" | "dotted";
export type Side = "top" | "bottom" | "left" | "right";

export type CellStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  size?: number;
  /** RRGGBB, no leading #. */
  color?: string;
  font?: string;
  /** RRGGBB solid background. */
  fill?: string;
  border?: { style: BorderStyle; color: string; sides?: Side[] };
  /** Excel number format code, e.g. `yyyy-mm-dd` or `"$"#,##0.00`. */
  numFmt?: string;
  align?: { h?: HAlign; v?: VAlign; wrap?: boolean; indent?: number };
};

export type CellValue = string | number | boolean | null | undefined;

export type CellInput = {
  v?: CellValue;
  /** A calendar day YYYY-MM-DD stored as a real Excel date serial. */
  date?: string;
  /** Formula without the leading "=". `cached` is the result shown by viewers that do not recalculate. */
  f?: string;
  cached?: number | string | boolean;
  s?: CellStyle;
  /** External URL (https://...) or an in-workbook target written as `#'Sheet'!A1`. */
  link?: string;
  linkTip?: string;
};

export type PrintSetup = {
  landscape?: boolean;
  fitToWidth?: boolean;
  /** 0-based inclusive rows repeated on every printed page. */
  repeatRows?: [number, number];
  paper?: "letter" | "a4";
  /** Footer, e.g. "Prepared with Receipt Cycle". */
  footer?: string;
};

export type WorkbookProps = { title?: string; subject?: string; creator?: string; company?: string; description?: string; created?: Date };

const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const MAX_CELL_CHARS = 32000;

// eslint-disable-next-line no-control-regex
const BAD_XML_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;

export function xmlEscape(value: string): string {
  return value
    .replace(BAD_XML_CHARS, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 0 -> A, 25 -> Z, 26 -> AA */
export function colLetter(col: number): string {
  let n = col;
  let out = "";
  do {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return out;
}

export function cellRef(row: number, col: number, abs = false): string {
  return abs ? `$${colLetter(col)}$${row + 1}` : `${colLetter(col)}${row + 1}`;
}

/** Quote a sheet name for use in a formula or defined name. */
export function sheetRef(name: string): string {
  return `'${name.replace(/'/g, "''")}'`;
}

/** Excel serial for a calendar day (1900 date system). Returns null when the text is not a real day. */
export function ymdToSerial(ymd: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const ms = Date.UTC(y, mo - 1, d);
  const probe = new Date(ms);
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) return null;
  // 25569 = days from 1899-12-30 to 1970-01-01
  return Math.round(ms / 86_400_000) + 25569;
}

function safeSheetName(name: string, used: Set<string>): string {
  let base = name.replace(/[\[\]:*?/\\]/g, " ").replace(/^'+|'+$/g, "").trim().slice(0, 31) || "Sheet";
  let candidate = base;
  let i = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` (${i++})`;
    candidate = base.slice(0, 31 - suffix.length) + suffix;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

type Cell = { v?: CellValue; f?: string; cached?: number | string | boolean; xf: number; link?: string; linkTip?: string };

export class SheetBuilder {
  readonly cells = new Map<number, Map<number, Cell>>();
  readonly colWidths = new Map<number, number>();
  readonly rowHeights = new Map<number, number>();
  readonly merges: string[] = [];
  readonly zebras: { ref: string; fill: string }[] = [];
  tabColor?: string;
  freeze?: { rows: number; cols: number };
  autoFilter?: string;
  print: PrintSetup = {};
  showGridLines = true;
  zoom = 100;

  constructor(
    readonly name: string,
    private readonly wb: Workbook,
  ) {}

  /** Write one cell. A bare value is shorthand for `{ v }`. */
  set(row: number, col: number, input: CellInput | CellValue, style?: CellStyle): this {
    const cell: CellInput = input !== null && typeof input === "object" ? (input as CellInput) : { v: input as CellValue };
    const merged = { ...(style ?? {}), ...(cell.s ?? {}) };
    let v = cell.v;
    if (cell.date !== undefined) {
      const serial = ymdToSerial(cell.date);
      v = serial === null ? cell.date : serial;
    }
    if (typeof v === "string" && v.length > MAX_CELL_CHARS) v = v.slice(0, MAX_CELL_CHARS);
    if (typeof v === "number" && !Number.isFinite(v)) v = null;
    const out: Cell = { v, f: cell.f, cached: cell.cached, xf: this.wb.xfFor(merged), link: cell.link, linkTip: cell.linkTip };
    let r = this.cells.get(row);
    if (!r) this.cells.set(row, (r = new Map()));
    r.set(col, out);
    return this;
  }

  /** Write a row of values starting at `col`. */
  setRow(row: number, col: number, values: (CellInput | CellValue)[], style?: CellStyle): this {
    values.forEach((v, i) => this.set(row, col + i, v, style));
    return this;
  }

  /** Apply a style to every cell in a rectangle that has no cell yet (used to paint banners and merged areas). */
  paint(r1: number, c1: number, r2: number, c2: number, style: CellStyle): this {
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) if (!this.cells.get(r)?.has(c)) this.set(r, c, null, style);
    return this;
  }

  merge(r1: number, c1: number, r2: number, c2: number): this {
    this.merges.push(`${cellRef(r1, c1)}:${cellRef(r2, c2)}`);
    return this;
  }

  width(col: number, chars: number): this {
    this.colWidths.set(col, Math.max(2, Math.min(80, chars)));
    return this;
  }

  height(row: number, points: number): this {
    this.rowHeights.set(row, points);
    return this;
  }

  /** Alternate-row shading via conditional formatting, so it stays correct after the user sorts or filters. */
  zebra(r1: number, c1: number, r2: number, c2: number, fill: string): this {
    this.zebras.push({ ref: `${cellRef(r1, c1)}:${cellRef(r2, c2)}`, fill });
    return this;
  }

  setAutoFilter(r1: number, c1: number, r2: number, c2: number): this {
    this.autoFilter = `${cellRef(r1, c1)}:${cellRef(r2, c2)}`;
    return this;
  }

  /** Set column widths from the longest text in each column (clamped), using rows `fromRow..toRow`. */
  autoWidth(fromRow: number, toRow: number, cols: number[], min = 8, max = 48): this {
    for (const c of cols) {
      let longest = 0;
      for (let r = fromRow; r <= toRow; r++) {
        const cell = this.cells.get(r)?.get(c);
        if (!cell) continue;
        const text = cell.v === null || cell.v === undefined ? (cell.cached !== undefined ? String(cell.cached) : "") : String(cell.v);
        const first = text.split("\n").reduce((a, b) => (b.length > a.length ? b : a), "");
        longest = Math.max(longest, first.length);
      }
      this.width(c, Math.max(min, Math.min(max, longest + 2)));
    }
    return this;
  }

  // ---- serialisation ----

  /** Highest used row/col (0-based) or null when empty. */
  private extent(): { maxRow: number; maxCol: number } | null {
    let maxRow = -1;
    let maxCol = -1;
    for (const [r, row] of this.cells) {
      if (row.size === 0) continue;
      maxRow = Math.max(maxRow, r);
      for (const c of row.keys()) maxCol = Math.max(maxCol, c);
    }
    return maxRow < 0 ? null : { maxRow, maxCol };
  }

  toXml(index: number): { xml: string; rels: string | null } {
    const ext = this.extent();
    const links: { ref: string; id?: string; location?: string; tip?: string }[] = [];
    const relTargets: string[] = [];
    let sheetData = "";
    const rowIds = [...new Set([...this.cells.keys(), ...this.rowHeights.keys()])].sort((a, b) => a - b);
    for (const r of rowIds) {
      const ht = this.rowHeights.get(r);
      let rowXml = `<row r="${r + 1}"${ht ? ` ht="${ht}" customHeight="1"` : ""}>`;
      const row = this.cells.get(r);
      if (row) {
        for (const c of [...row.keys()].sort((a, b) => a - b)) {
          const cell = row.get(c)!;
          const ref = cellRef(r, c);
          const s = cell.xf ? ` s="${cell.xf}"` : "";
          if (cell.link) {
            if (cell.link.startsWith("#")) links.push({ ref, location: cell.link.slice(1), tip: cell.linkTip });
            else {
              relTargets.push(cell.link);
              links.push({ ref, id: `rId${relTargets.length}`, tip: cell.linkTip });
            }
          }
          if (cell.f !== undefined) {
            const cv = cell.cached;
            const t = typeof cv === "string" ? ' t="str"' : typeof cv === "boolean" ? ' t="b"' : "";
            const shown = typeof cv === "number" ? Number(cv.toPrecision(12)) : cv; // trims float noise such as 19436.250000000015
            const val = shown === undefined ? "" : `<v>${typeof shown === "boolean" ? (shown ? 1 : 0) : xmlEscape(String(shown))}</v>`;
            rowXml += `<c r="${ref}"${s}${t}><f>${xmlEscape(cell.f)}</f>${val}</c>`;
          } else if (cell.v === null || cell.v === undefined || cell.v === "") {
            rowXml += `<c r="${ref}"${s}/>`;
          } else if (typeof cell.v === "number") {
            rowXml += `<c r="${ref}"${s}><v>${cell.v}</v></c>`;
          } else if (typeof cell.v === "boolean") {
            rowXml += `<c r="${ref}"${s} t="b"><v>${cell.v ? 1 : 0}</v></c>`;
          } else {
            rowXml += `<c r="${ref}"${s} t="s"><v>${this.wb.sharedString(cell.v)}</v></c>`;
          }
        }
      }
      sheetData += rowXml + "</row>";
    }

    const fit = this.print.fitToWidth !== false;
    let xml = XML_HEAD + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">';
    xml += "<sheetPr>" + (this.tabColor ? `<tabColor rgb="FF${this.tabColor}"/>` : "") + (fit ? '<pageSetUpPr fitToPage="1"/>' : "") + "</sheetPr>";
    if (ext) xml += `<dimension ref="A1:${cellRef(ext.maxRow, ext.maxCol)}"/>`;
    xml += `<sheetViews><sheetView workbookViewId="0"${index === 0 ? ' tabSelected="1"' : ""}${this.showGridLines ? "" : ' showGridLines="0"'}${this.zoom !== 100 ? ` zoomScale="${this.zoom}" zoomScaleNormal="${this.zoom}"` : ""}>`;
    if (this.freeze && (this.freeze.rows || this.freeze.cols)) {
      const { rows, cols } = this.freeze;
      const tl = cellRef(rows, cols);
      const pane = rows && cols ? "bottomRight" : rows ? "bottomLeft" : "topRight";
      xml += `<pane${cols ? ` xSplit="${cols}"` : ""}${rows ? ` ySplit="${rows}"` : ""} topLeftCell="${tl}" activePane="${pane}" state="frozen"/><selection pane="${pane}" activeCell="${tl}" sqref="${tl}"/>`;
    }
    xml += "</sheetView></sheetViews>";
    xml += '<sheetFormatPr defaultRowHeight="15"/>';
    if (this.colWidths.size) {
      xml += "<cols>";
      for (const c of [...this.colWidths.keys()].sort((a, b) => a - b)) xml += `<col min="${c + 1}" max="${c + 1}" width="${this.colWidths.get(c)}" customWidth="1"/>`;
      xml += "</cols>";
    }
    xml += `<sheetData>${sheetData}</sheetData>`;
    if (this.autoFilter) xml += `<autoFilter ref="${this.autoFilter}"/>`;
    if (this.merges.length) xml += `<mergeCells count="${this.merges.length}">${this.merges.map((m) => `<mergeCell ref="${m}"/>`).join("")}</mergeCells>`;
    this.zebras.forEach((z, i) => {
      const first = z.ref.split(":")[0]!;
      const row = Number(/\d+/.exec(first)![0]);
      const dxf = this.wb.dxfFor(z.fill);
      xml += `<conditionalFormatting sqref="${z.ref}"><cfRule type="expression" dxfId="${dxf}" priority="${i + 1}"><formula>MOD(ROW()-${row},2)=1</formula></cfRule></conditionalFormatting>`;
    });
    if (links.length) {
      xml += "<hyperlinks>";
      for (const l of links) {
        xml += `<hyperlink ref="${l.ref}"${l.id ? ` r:id="${l.id}"` : ""}${l.location ? ` location="${xmlEscape(l.location)}"` : ""}${l.tip ? ` tooltip="${xmlEscape(l.tip)}"` : ""}/>`;
      }
      xml += "</hyperlinks>";
    }
    xml += '<printOptions horizontalCentered="1"/><pageMargins left="0.5" right="0.5" top="0.6" bottom="0.7" header="0.3" footer="0.3"/>';
    xml += `<pageSetup paperSize="${this.print.paper === "a4" ? 9 : 1}" orientation="${this.print.landscape === false ? "portrait" : "landscape"}"${fit ? ' fitToWidth="1" fitToHeight="0"' : ""}/>`;
    xml += `<headerFooter><oddFooter>${xmlEscape(`&L${this.print.footer ?? ""}&RPage &P of &N`)}</oddFooter></headerFooter>`;
    xml += "</worksheet>";

    const rels = relTargets.length
      ? XML_HEAD +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        relTargets
          .map((t, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${xmlEscape(t)}" TargetMode="External"/>`)
          .join("") +
        "</Relationships>"
      : null;
    return { xml, rels };
  }
}

export class Workbook {
  readonly sheets: SheetBuilder[] = [];
  private readonly names = new Set<string>();
  private readonly strings = new Map<string, number>();
  private readonly fonts: string[] = [];
  private readonly fills: string[] = [];
  private readonly borders: string[] = [];
  private readonly numFmts = new Map<string, number>();
  private readonly xfs: string[] = [];
  private readonly xfIndex = new Map<string, number>();
  private readonly dxfs: string[] = [];
  private readonly dxfIndex = new Map<string, number>();
  private readonly cache = { font: new Map<string, number>(), fill: new Map<string, number>(), border: new Map<string, number>() };

  constructor(readonly props: WorkbookProps = {}) {
    this.fonts.push(this.fontXml({}));
    this.cache.font.set(this.fontXml({}), 0);
    this.fills.push('<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>');
    this.borders.push("<border><left/><right/><top/><bottom/><diagonal/></border>");
    this.xfs.push('<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>');
    this.xfIndex.set("", 0);
  }

  addSheet(name: string): SheetBuilder {
    const sheet = new SheetBuilder(safeSheetName(name, this.names), this);
    this.sheets.push(sheet);
    return sheet;
  }

  sharedString(text: string): number {
    const clean = text.replace(BAD_XML_CHARS, "");
    let i = this.strings.get(clean);
    if (i === undefined) {
      i = this.strings.size;
      this.strings.set(clean, i);
    }
    return i;
  }

  private fontXml(s: CellStyle): string {
    return `<font>${s.bold ? "<b/>" : ""}${s.italic ? "<i/>" : ""}${s.underline ? "<u/>" : ""}<sz val="${s.size ?? 11}"/><color rgb="FF${s.color ?? "000000"}"/><name val="${xmlEscape(s.font ?? "Calibri")}"/><family val="2"/></font>`;
  }

  private borderXml(b: NonNullable<CellStyle["border"]>): string {
    const sides = b.sides ?? ["top", "bottom", "left", "right"];
    const side = (n: Side) => (sides.includes(n) ? `<${n} style="${b.style}"><color rgb="FF${b.color}"/></${n}>` : `<${n}/>`);
    return `<border>${side("left")}${side("right")}${side("top")}${side("bottom")}<diagonal/></border>`;
  }

  private intern(list: string[], cache: Map<string, number>, xml: string): number {
    let i = cache.get(xml);
    if (i === undefined) {
      i = list.length;
      list.push(xml);
      cache.set(xml, i);
    }
    return i;
  }

  private numFmtId(code: string): number {
    const builtin: Record<string, number> = { General: 0, "0": 1, "0.00": 2, "#,##0": 3, "#,##0.00": 4, "0%": 9, "0.00%": 10 };
    if (code in builtin) return builtin[code]!;
    let id = this.numFmts.get(code);
    if (id === undefined) {
      id = 164 + this.numFmts.size;
      this.numFmts.set(code, id);
    }
    return id;
  }

  /** Index into cellXfs for a style (0 = default). Identical styles share one entry. */
  xfFor(s: CellStyle): number {
    const key = JSON.stringify([s.bold, s.italic, s.underline, s.size, s.color, s.font, s.fill, s.border, s.numFmt, s.align]);
    if (key === JSON.stringify([]) || key === "[null,null,null,null,null,null,null,null,null,null]") return 0;
    const cached = this.xfIndex.get(key);
    if (cached !== undefined) return cached;
    const font = s.bold || s.italic || s.underline || s.size || s.color || s.font ? this.intern(this.fonts, this.cache.font, this.fontXml(s)) : 0;
    const fill = s.fill ? this.intern(this.fills, this.cache.fill, `<fill><patternFill patternType="solid"><fgColor rgb="FF${s.fill}"/><bgColor indexed="64"/></patternFill></fill>`) : 0;
    const border = s.border ? this.intern(this.borders, this.cache.border, this.borderXml(s.border)) : 0;
    const fmt = s.numFmt ? this.numFmtId(s.numFmt) : 0;
    const a = s.align;
    const alignXml = a ? `<alignment${a.h ? ` horizontal="${a.h}"` : ""}${a.v ? ` vertical="${a.v}"` : ""}${a.wrap ? ' wrapText="1"' : ""}${a.indent ? ` indent="${a.indent}"` : ""}/>` : "";
    const xf = `<xf numFmtId="${fmt}" fontId="${font}" fillId="${fill}" borderId="${border}" xfId="0"${fmt ? ' applyNumberFormat="1"' : ""}${font ? ' applyFont="1"' : ""}${fill ? ' applyFill="1"' : ""}${border ? ' applyBorder="1"' : ""}${a ? ' applyAlignment="1"' : ""}>${alignXml}</xf>`;
    const idx = this.xfs.length;
    this.xfs.push(xf);
    this.xfIndex.set(key, idx);
    return idx;
  }

  dxfFor(fill: string): number {
    let i = this.dxfIndex.get(fill);
    if (i === undefined) {
      i = this.dxfs.length;
      this.dxfs.push(`<dxf><fill><patternFill patternType="solid"><fgColor rgb="FF${fill}"/><bgColor rgb="FF${fill}"/></patternFill></fill></dxf>`);
      this.dxfIndex.set(fill, i);
    }
    return i;
  }

  private stylesXml(): string {
    const fmts = [...this.numFmts].map(([code, id]) => `<numFmt numFmtId="${id}" formatCode="${xmlEscape(code)}"/>`).join("");
    return (
      XML_HEAD +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      (fmts ? `<numFmts count="${this.numFmts.size}">${fmts}</numFmts>` : "") +
      `<fonts count="${this.fonts.length}">${this.fonts.join("")}</fonts>` +
      `<fills count="${this.fills.length}">${this.fills.join("")}</fills>` +
      `<borders count="${this.borders.length}">${this.borders.join("")}</borders>` +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      `<cellXfs count="${this.xfs.length}">${this.xfs.join("")}</cellXfs>` +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
      `<dxfs count="${this.dxfs.length}">${this.dxfs.join("")}</dxfs>` +
      "</styleSheet>"
    );
  }

  /** Build the .xlsx file bytes. */
  build(): Uint8Array {
    if (!this.sheets.length) this.addSheet("Sheet1");
    const sheetParts = this.sheets.map((s, i) => s.toXml(i)); // must run first: fills the shared string table
    const created = (this.props.created ?? new Date()).toISOString().replace(/\.\d{3}Z$/, "Z");
    const files: Record<string, Uint8Array> = {};
    const put = (path: string, text: string) => (files[path] = strToU8(text));

    put(
      "[Content_Types].xml",
      XML_HEAD +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        this.sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("") +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>' +
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
        '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>',
    );
    put(
      "_rels/.rels",
      XML_HEAD +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>',
    );
    const p = this.props;
    put(
      "docProps/core.xml",
      XML_HEAD +
        '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
        (p.title ? `<dc:title>${xmlEscape(p.title)}</dc:title>` : "") +
        (p.subject ? `<dc:subject>${xmlEscape(p.subject)}</dc:subject>` : "") +
        `<dc:creator>${xmlEscape(p.creator ?? "Receipt Cycle")}</dc:creator>` +
        (p.description ? `<dc:description>${xmlEscape(p.description)}</dc:description>` : "") +
        `<dcterms:created xsi:type="dcterms:W3CDTF">${created}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${created}</dcterms:modified></cp:coreProperties>`,
    );
    put(
      "docProps/app.xml",
      XML_HEAD +
        `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Receipt Cycle</Application>${p.company ? `<Company>${xmlEscape(p.company)}</Company>` : ""}</Properties>`,
    );

    let definedNames = "";
    this.sheets.forEach((s, i) => {
      const rr = s.print.repeatRows;
      if (rr) definedNames += `<definedName name="_xlnm.Print_Titles" localSheetId="${i}">${xmlEscape(sheetRef(s.name))}!$${rr[0] + 1}:$${rr[1] + 1}</definedName>`;
      if (s.autoFilter) {
        const [a, b] = s.autoFilter.split(":") as [string, string];
        const abs = (x: string) => x.replace(/^([A-Z]+)(\d+)$/, "$$$1$$$2");
        definedNames += `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">${xmlEscape(sheetRef(s.name))}!${abs(a)}:${abs(b)}</definedName>`;
      }
    });
    put(
      "xl/workbook.xml",
      XML_HEAD +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets>' +
        this.sheets.map((s, i) => `<sheet name="${xmlEscape(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("") +
        "</sheets>" +
        (definedNames ? `<definedNames>${definedNames}</definedNames>` : "") +
        '<calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>',
    );
    const n = this.sheets.length;
    put(
      "xl/_rels/workbook.xml.rels",
      XML_HEAD +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        this.sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("") +
        `<Relationship Id="rId${n + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId${n + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>`,
    );
    sheetParts.forEach((part, i) => {
      put(`xl/worksheets/sheet${i + 1}.xml`, part.xml);
      if (part.rels) put(`xl/worksheets/_rels/sheet${i + 1}.xml.rels`, part.rels);
    });
    put("xl/styles.xml", this.stylesXml());
    put(
      "xl/sharedStrings.xml",
      XML_HEAD +
        `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${this.strings.size}" uniqueCount="${this.strings.size}">` +
        [...this.strings.keys()].map((t) => `<si><t xml:space="preserve">${xmlEscape(t)}</t></si>`).join("") +
        "</sst>",
    );
    return zipSync(files, { level: 6 });
  }
}
