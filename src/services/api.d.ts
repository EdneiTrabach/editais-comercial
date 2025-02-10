declare const api: import("axios").AxiosInstance;
export declare const setorService: {
    listarSetores(): Promise<any[]>;
    cadastrarSetor(nome: string): Promise<any>;
};
export declare const usuariosService: {
    getAll(): Promise<{
        data: any[];
    }>;
    update(id: string, userData: any): Promise<{
        data: never;
    }>;
    delete(id: string): Promise<{
        data: null;
    }>;
};
export default api;
export declare const certificadosService: {};
