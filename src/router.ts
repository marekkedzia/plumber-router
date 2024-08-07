import {Router, Response, NextFunction} from 'express';
import {RouterConfig} from "./interfaces/router.config";
import {ParameterizedRequest} from "./interfaces/parameterized.request";
import {RouterMiddleware} from "./interfaces/router.middleware";
import {RouterCustomParameters} from "./interfaces/router.custom.parameters";
import {config} from "./config";
import {HttpMethod} from "./interfaces/http.methods";

class Plumber {
    router: Router;

    constructor(private routerConfig: RouterConfig) {
        this.router = Router();
    }

    private registerRoute<T>(method: HttpMethod, pipesAndFilters: RouterMiddleware<T>[], customParameters?: RouterCustomParameters) {
        const path = customParameters?.path || this.routerConfig.path;
        const methodStatusCode = config[`${method}StatusCode`];

        this.router[method](path,
            // @ts-ignore
            async (req: ParameterizedRequest<T>, _: Response, next: NextFunction) => {
                for (const middleware of pipesAndFilters) {
                    if (middleware.type === "pipe") {
                        await middleware.handle(req);
                    } else if (middleware.type === "filter") {
                        req.parameter = await middleware.handle(req);
                    }
                }
                next();
            }, (req: ParameterizedRequest<T>, res: Response) => {
                return res.status(methodStatusCode).json(req.parameter);
            });
    }

    register<T>(method: HttpMethod, pipesAndFilters: RouterMiddleware<T>[], customParameters?: RouterCustomParameters) {
        this.registerRoute(method, pipesAndFilters, customParameters);
    }
}

export {Plumber};
