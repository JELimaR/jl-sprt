import { SportAPIController } from "../JSportModule";
import JSportFactoryServer from "./JSportFactoryServer";

function SportServerAPI() { return new SportAPIController(JSportFactoryServer.instance); }

export default SportServerAPI;
