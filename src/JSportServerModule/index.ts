import { SportAPIController } from "../JSportModule";
import { SportFactoryServer } from "./SportFactoryServer";

export function SportServerAPI() { return new SportAPIController(SportFactoryServer.instance); }
