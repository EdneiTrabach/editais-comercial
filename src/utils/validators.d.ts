export declare const validators: {
    required: (value: any) => boolean;
    email: (value: string) => boolean;
    minLength: (value: string, min: number) => boolean;
    maxLength: (value: string, max: number) => boolean;
    numeric: (value: string) => boolean;
    alphanumeric: (value: string) => boolean;
    cpf: (cpf: string) => boolean;
};
