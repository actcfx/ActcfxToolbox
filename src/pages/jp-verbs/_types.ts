// Shape of src/data/jp-verbs.json

interface RowBase {
    id: string;
    word: number;
    dic: string;
    masu: string;
    te: string;
    group: number;
    vt: "自" | "他" | "自／他";
    note: string;
}

export interface OriginalRow extends RowBase {
    type: "original";
    kids: number;
}

export interface ComparisonRow extends RowBase {
    type: "comparison";
    parent: number;
    kind: "related" | "pair";
    lesson: number;
}

export type Row = OriginalRow | ComparisonRow;

export interface Lesson {
    n: number;
    rows: Row[];
}

export interface Section {
    id: string;
    name: string;
    label: string;
    lessons: Lesson[];
}

export interface VerbData {
    usage: string[];
    refs: string[];
    sections: Section[];
}
