interface Municipio {
    id: number;
    nome: string;
}
export declare const ibgeService: {
    getMunicipios(uf: string): Promise<Municipio[]>;
};
export {};
