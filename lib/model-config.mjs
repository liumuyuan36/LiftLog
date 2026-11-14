// Every current text task uses the same independently fine-tuned Atlas artifact.
import {ATLAS_MODEL,providerChanged} from './atlas-text-config.mjs';
export {atlasTextAvailability as aiAvailability} from './atlas-text-runtime.mjs';
export const primaryModel=()=>ATLAS_MODEL;
export const retiredProvider=providerChanged;
