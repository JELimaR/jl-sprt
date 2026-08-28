import { SportAPIController } from "../JSportModule";
import SportFactoryServer from "./SportFactoryServer";

function SportServerAPI() { return new SportAPIController(SportFactoryServer.instance); }

export default SportServerAPI;
