import dropdownOptions from './dropdownOptions.json';

/** Same list as ValutazioneForm (nuovo intervento) — excludes free-text "Altro". */
export const interventoDiOptions = dropdownOptions.interventoDi.filter((o) => o !== 'Altro');

export const costoOptions = dropdownOptions.costo.filter((o) => o !== 'Edit...');
