import type { Request, Response } from "express"


interface Usuario{
    nombre: string,
    correo: string,
    password: string,
}

const RegistrarUsuario = (req: Request, res: Response) => {
    const {nombre, correo, password} = req.body as Usuario
    
}