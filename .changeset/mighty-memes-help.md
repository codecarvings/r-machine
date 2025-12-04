---
"r-machine": patch
---

Change behaviour of RMachine methods pickR, hybridPickR, pickRKit and hybridPickRKit so that the provided locale param is validated before use and is not mapped via the localeMapper method;
Remove LocaleMapperManager class;
Remove localeMapper option from RMachineConfig interface.
