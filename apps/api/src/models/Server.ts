import express from 'express';
import cors from 'cors';
import { createServer, type Server as HttpServer } from 'http';

interface Server{
    app: express.Application;
    port: number,
    server: HttpServer,
    apiPath: string
}

class Server{

    constructor(){
        this.app = express();
        this.port = 3080;
        this.server = createServer(this.app);
        this.apiPath = '/api';

    }

    middlewares(){
        this.app.use(cors());
        this.app.use(express.json());
    }

    routes(){
        this.app.use("/auth", )
    }

    listen(){
        this.server.listen( this.port, () => {
            console.log(`Server running on port ${this.port}`);
        })
    }
}

export default Server ;