import { IJEventOthersInfo, JEventOthers } from "../../Calendar/Event/JEvent";
import JFederation, { TypeFederationReadingConfig } from "./JFederation";

interface IJEventChangeFederationReadingConfigInfo extends IJEventOthersInfo {
  config: TypeFederationReadingConfig;
  fed: JFederation;
}

export default class JEventChangeFederationReadingConfig extends JEventOthers {
  _config: TypeFederationReadingConfig;
  _fed: JFederation;
  constructor( iecslc: IJEventChangeFederationReadingConfigInfo ) {
    super(iecslc);
    this._config = iecslc.config;
    this._fed = iecslc.fed;
  }

  execute(): void {
    switch (this._config.type) {
      case 'l':
        this._fed.setleagueSystem(this._config.config)
        break;
      case 'c':
        this._fed.setCupSystem(this._config.config)
        break;
      default:
        break;
    }
  }
}