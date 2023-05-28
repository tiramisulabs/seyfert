import { RESTGetAPIVoiceRegionsResult } from '@biscuitland/common';
import { RestArguments } from '../REST';
import { RequestMethod } from '../Router';

export interface VoiceRoutes {
  voice: {
    region: {
      get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIVoiceRegionsResult>;
    };
  };
}
