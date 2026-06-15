// lib/emailTemplates.js
// Shared email template generators

const LOGO_B64 = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2ODAgMjAwIiB3aWR0aD0iNjgwIiBoZWlnaHQ9IjIwMCI+CiAgPGRlZnM+CgogICAgPCEtLSBHb2xkIGdyYWRpZW50IGZvciBiZXZlbC90ZXh0IC0tPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJnb2xkQmV2ZWwiIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgICBzdG9wLWNvbG9yPSIjRThDOTZBIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMzAlIiAgc3RvcC1jb2xvcj0iI0M4OTIyQSIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjcwJSIgIHN0b3AtY29sb3I9IiM5QTZFMUEiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjQzg5MjJBIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgoKICAgIDwhLS0gT2xpdmUgZ3JlZW4gZmlsbCBncmFkaWVudCAoM0QgdG9wLWxpZ2h0IGVmZmVjdCkgLS0+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImdyZWVuRmlsbCIgeDE9IjAiIHkxPSIwIiB4Mj0iMCIgeTI9IjEiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiAgIHN0b3AtY29sb3I9IiM1QTcwMzUiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI0MCUiICBzdG9wLWNvbG9yPSIjNEE1QzI4Ii8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzJFM0ExOCIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KCiAgICA8IS0tIEdvbGQgc3Ryb2tlIGZvciBtYXJrIG91dGxpbmUgLS0+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImdvbGRTdHJva2UiIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgICBzdG9wLWNvbG9yPSIjRDRBODQwIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzhBNjAxMCIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KCiAgICA8IS0tIEJyYXNzIGNhcnRyaWRnZSBib2R5IGdyYWRpZW50IC0tPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJicmFzc0JvZHkiIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgICBzdG9wLWNvbG9yPSIjRDRBMDM1Ii8+CiAgICAgIDxzdG9wIG9mZnNldD0iMjUlIiAgc3RvcC1jb2xvcj0iI0M4OTIyQSIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjUwJSIgIHN0b3AtY29sb3I9IiNFOEI4NDAiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSI3NSUiICBzdG9wLWNvbG9yPSIjQjA3ODIwIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzhBNUUxMCIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KCiAgICA8IS0tIENvcHBlciBidWxsZXQgdGlwIGdyYWRpZW50IC0tPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJjb3BwZXJUaXAiIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIwIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgICBzdG9wLWNvbG9yPSIjQzg3MDQwIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iNDAlIiAgc3RvcC1jb2xvcj0iI0UwOTA1MCIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM3QTQwMjAiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CgogICAgPCEtLSBDYXJ0cmlkZ2UgY2FzZSBuZWNrIHRhcGVyIC0tPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJicmFzc05lY2siIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgICBzdG9wLWNvbG9yPSIjQzg5MDMwIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzlBNjgxOCIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KCiAgICA8IS0tIERyb3Agc2hhZG93IGZpbHRlciAtLT4KICAgIDxmaWx0ZXIgaWQ9ImRyb3BTaGFkb3ciIHg9Ii01JSIgeT0iLTUlIiB3aWR0aD0iMTE1JSIgaGVpZ2h0PSIxMjAlIj4KICAgICAgPGZlRHJvcFNoYWRvdyBkeD0iMCIgZHk9IjMiIHN0ZERldmlhdGlvbj0iNCIgZmxvb2QtY29sb3I9IiMwMDAwMDAiIGZsb29kLW9wYWNpdHk9IjAuNiIvPgogICAgPC9maWx0ZXI+CgogICAgPCEtLSBTdWJ0bGUgaW5uZXIgZ2xvdyBmb3IgdGV4dCBvbiBkYXJrIGJnIC0tPgogICAgPGZpbHRlciBpZD0idGV4dEdsb3ciIHg9Ii0yJSIgeT0iLTUlIiB3aWR0aD0iMTEwJSIgaGVpZ2h0PSIxMjAlIj4KICAgICAgPGZlRHJvcFNoYWRvdyBkeD0iMCIgZHk9IjEiIHN0ZERldmlhdGlvbj0iMiIgZmxvb2QtY29sb3I9IiNDODkyMkEiIGZsb29kLW9wYWNpdHk9IjAuNCIvPgogICAgPC9maWx0ZXI+CgogICAgPCEtLSBDbGlwIHBhdGggZm9yIGNoZXZyb24gbWFyayBhcmVhIC0tPgogICAgPGNsaXBQYXRoIGlkPSJtYXJrQ2xpcCI+CiAgICAgIDxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIyMTAiIGhlaWdodD0iMjAwIi8+CiAgICA8L2NsaXBQYXRoPgoKICA8L2RlZnM+CgogIDwhLS0g4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQCiAgICAgICBDSEVWUk9OIC8gRE9VQkxFLUFSUk9XIE1BUksKICAgICAgIFR3byBzdGFja2VkIHJpZ2h0d2FyZCBjaGV2cm9ucyBmb3JtaW5nIGEgIkQiIG1vdGlmCiAgICAgICDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZAgLS0+CgogIDxnIGZpbHRlcj0idXJsKCNkcm9wU2hhZG93KSI+CgogICAgPCEtLSBPVVRFUiBDSEVWUk9OIChsYXJnZXIsIGJvdHRvbS1sZWZ0KSAtLT4KICAgIDwhLS0gR29sZCBib3JkZXIgbGF5ZXIgKGRyYXduIHNsaWdodGx5IGxhcmdlcikgLS0+CiAgICA8cG9seWdvbiBwb2ludHM9IgogICAgICAyOCwxODUgIDU4LDE4NSAgMTM4LDEwMCAgNTgsMTUgIDI4LDE1CiAgICAgIDY1LDE1ICAgMTQ4LDEwMCAgNjUsMTg1CiAgICAiIGZpbGw9InVybCgjZ29sZEJldmVsKSIgLz4KICAgIDwhLS0gR3JlZW4gZmlsbCBsYXllciAoaW5zZXQpIC0tPgogICAgPHBvbHlnb24gcG9pbnRzPSIKICAgICAgMzUsMTc4ICA2MCwxNzggIDEzNSwxMDAgIDYwLDIyICAzNSwyMgogICAgICA2MiwyMiAgIDE0MCwxMDAgIDYyLDE3OAogICAgIiBmaWxsPSJ1cmwoI2dyZWVuRmlsbCkiIC8+CgogICAgPCEtLSBJTk5FUiBDSEVWUk9OIChzbWFsbGVyLCBvZmZzZXQgcmlnaHQpIC0tPgogICAgPCEtLSBHb2xkIGJvcmRlciAtLT4KICAgIDxwb2x5Z29uIHBvaW50cz0iCiAgICAgIDcyLDE3MCAgOTgsMTcwICAxNjgsMTAwICA5OCwzMCAgNzIsMzAKICAgICAgMTA1LDMwICAxNzgsMTAwICAxMDUsMTcwCiAgICAiIGZpbGw9InVybCgjZ29sZEJldmVsKSIgLz4KICAgIDwhLS0gR3JlZW4gZmlsbCAtLT4KICAgIDxwb2x5Z29uIHBvaW50cz0iCiAgICAgIDc5LDE2MyAgMTAwLDE2MyAgMTY0LDEwMCAgMTAwLDM3ICA3OSwzNwogICAgICAxMDcsMzcgIDE3MiwxMDAgIDEwNywxNjMKICAgICIgZmlsbD0idXJsKCNncmVlbkZpbGwpIiAvPgoKICAgIDwhLS0gTkVHQVRJVkUgU1BBQ0UgQ1VUIOKAlCBpbm5lciBob2xsb3cgb2Ygb3V0ZXIgY2hldnJvbiAtLT4KICAgIDwhLS0gQ3JlYXRlcyB0aGUgIm9wZW4gRCIgbG9vayBmcm9tIHRoZSByZWZlcmVuY2UgLS0+CiAgICA8cG9seWdvbiBwb2ludHM9IgogICAgICA2MiwxNTUgIDg1LDE1NSAgMTQ4LDEwMCAgODUsNDUgIDYyLDQ1CiAgICAgIDcwLDQ1ICAgMTQwLDEwMCAgNzAsMTU1CiAgICAiIGZpbGw9IiMwQTBCMEMiIC8+CgogIDwvZz4KCiAgPCEtLSDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZAKICAgICAgIEJVTExFVCAvIENBUlRSSURHRQogICAgICAgUG9zaXRpb25lZCB0aHJvdWdoIHRoZSBjaGV2cm9ucywgcG9pbnRpbmcgcmlnaHQKICAgICAgIOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkCAtLT4KCiAgPGcgZmlsdGVyPSJ1cmwoI2Ryb3BTaGFkb3cpIj4KCiAgICA8IS0tIENhcnRyaWRnZSBjYXNlIGJhc2UgKGZsYXQgZW5kLCBsZWZ0KSAtLT4KICAgIDxyZWN0IHg9IjgiIHk9IjkxIiB3aWR0aD0iMTIiIGhlaWdodD0iMTgiIHJ4PSIxLjUiCiAgICAgICAgICBmaWxsPSJ1cmwoI2JyYXNzQm9keSkiIC8+CgogICAgPCEtLSBFeHRyYWN0b3IgZ3Jvb3ZlIHJpbmcgLS0+CiAgICA8cmVjdCB4PSIxOCIgeT0iOTIiIHdpZHRoPSI0IiBoZWlnaHQ9IjE2IgogICAgICAgICAgZmlsbD0iIzdBNTAxMCIgLz4KCiAgICA8IS0tIE1haW4gY2FydHJpZGdlIGJvZHkgLS0+CiAgICA8cmVjdCB4PSIyMiIgeT0iOTAiIHdpZHRoPSI5NSIgaGVpZ2h0PSIyMCIgcng9IjEiCiAgICAgICAgICBmaWxsPSJ1cmwoI2JyYXNzQm9keSkiIC8+CgogICAgPCEtLSBIaWdobGlnaHQgc3RyaXBlIG9uIGNhc2UgLS0+CiAgICA8cmVjdCB4PSIyMiIgeT0iOTEiIHdpZHRoPSI5NSIgaGVpZ2h0PSI0IiByeD0iMSIKICAgICAgICAgIGZpbGw9IiNFOEMwNjAiIG9wYWNpdHk9IjAuNSIgLz4KCiAgICA8IS0tIENhc2UgZmx1dGVzIChkZWNvcmF0aXZlIGxpbmVzIG9uIGJvZHkpIC0tPgogICAgPGxpbmUgeDE9IjQ1IiB5MT0iOTAiIHgyPSI0NSIgeTI9IjExMCIgc3Ryb2tlPSIjOUE2ODE4IiBzdHJva2Utd2lkdGg9IjAuOCIgb3BhY2l0eT0iMC42Ii8+CiAgICA8bGluZSB4MT0iNjUiIHkxPSI5MCIgeDI9IjY1IiB5Mj0iMTEwIiBzdHJva2U9IiM5QTY4MTgiIHN0cm9rZS13aWR0aD0iMC44IiBvcGFjaXR5PSIwLjYiLz4KICAgIDxsaW5lIHgxPSI4NSIgeTE9IjkwIiB4Mj0iODUiIHkyPSIxMTAiIHN0cm9rZT0iIzlBNjgxOCIgc3Ryb2tlLXdpZHRoPSIwLjgiIG9wYWNpdHk9IjAuNiIvPgoKICAgIDwhLS0gTmVjayB0YXBlciAoY2FzZSB0byBidWxsZXQgdHJhbnNpdGlvbikgLS0+CiAgICA8cGF0aCBkPSJNIDExNyw5MCBMIDEyNyw5MyBMIDEyNywxMDcgTCAxMTcsMTEwIFoiCiAgICAgICAgICBmaWxsPSJ1cmwoI2JyYXNzTmVjaykiIC8+CgogICAgPCEtLSBDb3BwZXIgYnVsbGV0IG9naXZlIChwb2ludGVkIHRpcCwgcG9pbnRpbmcgcmlnaHQpIC0tPgogICAgPHBhdGggZD0iTSAxMjcsOTMgQyAxMjcsOTMgMTc1LDk3IDE4NiwxMDAgQyAxNzUsMTAzIDEyNywxMDcgMTI3LDEwNyBaIgogICAgICAgICAgZmlsbD0idXJsKCNjb3BwZXJUaXApIiAvPgoKICAgIDwhLS0gQnVsbGV0IGhpZ2hsaWdodCAtLT4KICAgIDxwYXRoIGQ9Ik0gMTI3LDk0IEMgMTI3LDk0IDE2OCw5NyAxODIsMTAwIEMgMTY4LDk4IDEyNyw5NyAxMjcsOTQgWiIKICAgICAgICAgIGZpbGw9IiNFOEEwNjAiIG9wYWNpdHk9IjAuNCIgLz4KCiAgPC9nPgoKICA8IS0tIOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkAogICAgICAgVEVYVCDigJQgIkRPV04iIChsYXJnZSwgdG9wIGxpbmUpCiAgICAgICDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZAgLS0+CgogIDwhLS0gVGV4dCB1c2VzIGEgbGF5ZXJlZCBhcHByb2FjaDogZ29sZCBzdHJva2UgYmVoaW5kLCBncmVlbiBmaWxsIG9uIHRvcCAtLT4KICA8IS0tIFRoaXMgZ2l2ZXMgdGhlIGJldmVsL2VtYm9zcyBlZmZlY3QgZnJvbSB0aGUgcmVmZXJlbmNlIC0tPgoKICA8ZyBmaWx0ZXI9InVybCgjdGV4dEdsb3cpIj4KCiAgICA8IS0tIERPV04g4oCUIGdvbGQgc2hhZG93L2JldmVsIGxheWVyIChvZmZzZXQgc2xpZ2h0bHkpIC0tPgogICAgPHRleHQgeD0iMjI4IiB5PSI5NSIKICAgICAgICAgIGZvbnQtZmFtaWx5PSInQmFybG93IENvbmRlbnNlZCcsICdBcmlhbCBOYXJyb3cnLCBzYW5zLXNlcmlmIgogICAgICAgICAgZm9udC13ZWlnaHQ9IjkwMCIKICAgICAgICAgIGZvbnQtc2l6ZT0iOTIiCiAgICAgICAgICBsZXR0ZXItc3BhY2luZz0iMiIKICAgICAgICAgIGZpbGw9InVybCgjZ29sZEJldmVsKSIKICAgICAgICAgIHRyYW5zZm9ybT0idHJhbnNsYXRlKDEuNSwgMikiPkRPV048L3RleHQ+CgogICAgPCEtLSBET1dOIOKAlCBncmVlbiBmaWxsIGxheWVyIC0tPgogICAgPHRleHQgeD0iMjI4IiB5PSI5NSIKICAgICAgICAgIGZvbnQtZmFtaWx5PSInQmFybG93IENvbmRlbnNlZCcsICdBcmlhbCBOYXJyb3cnLCBzYW5zLXNlcmlmIgogICAgICAgICAgZm9udC13ZWlnaHQ9IjkwMCIKICAgICAgICAgIGZvbnQtc2l6ZT0iOTIiCiAgICAgICAgICBsZXR0ZXItc3BhY2luZz0iMiIKICAgICAgICAgIGZpbGw9InVybCgjZ3JlZW5GaWxsKSI+RE9XTjwvdGV4dD4KCiAgICA8IS0tIERPV04g4oCUIGdvbGQgb3V0bGluZSBzdHJva2UgLS0+CiAgICA8dGV4dCB4PSIyMjgiIHk9Ijk1IgogICAgICAgICAgZm9udC1mYW1pbHk9IidCYXJsb3cgQ29uZGVuc2VkJywgJ0FyaWFsIE5hcnJvdycsIHNhbnMtc2VyaWYiCiAgICAgICAgICBmb250LXdlaWdodD0iOTAwIgogICAgICAgICAgZm9udC1zaXplPSI5MiIKICAgICAgICAgIGxldHRlci1zcGFjaW5nPSIyIgogICAgICAgICAgZmlsbD0ibm9uZSIKICAgICAgICAgIHN0cm9rZT0idXJsKCNnb2xkQmV2ZWwpIgogICAgICAgICAgc3Ryb2tlLXdpZHRoPSIxLjUiPkRPV048L3RleHQ+CgogIDwvZz4KCiAgPCEtLSDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZDilZAKICAgICAgIFRFWFQg4oCUICJSQU5HRSIgKGxhcmdlLCBib3R0b20gbGluZSkKICAgICAgIOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkCAtLT4KCiAgPGcgZmlsdGVyPSJ1cmwoI3RleHRHbG93KSI+CgogICAgPCEtLSBSQU5HRSDigJQgZ29sZCBiZXZlbCBsYXllciAtLT4KICAgIDx0ZXh0IHg9IjIyOCIgeT0iMTgzIgogICAgICAgICAgZm9udC1mYW1pbHk9IidCYXJsb3cgQ29uZGVuc2VkJywgJ0FyaWFsIE5hcnJvdycsIHNhbnMtc2VyaWYiCiAgICAgICAgICBmb250LXdlaWdodD0iOTAwIgogICAgICAgICAgZm9udC1zaXplPSI4OCIKICAgICAgICAgIGxldHRlci1zcGFjaW5nPSIyIgogICAgICAgICAgZmlsbD0idXJsKCNnb2xkQmV2ZWwpIgogICAgICAgICAgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMS41LCAyKSI+UkFOR0U8L3RleHQ+CgogICAgPCEtLSBSQU5HRSDigJQgZ3JlZW4gZmlsbCAtLT4KICAgIDx0ZXh0IHg9IjIyOCIgeT0iMTgzIgogICAgICAgICAgZm9udC1mYW1pbHk9IidCYXJsb3cgQ29uZGVuc2VkJywgJ0FyaWFsIE5hcnJvdycsIHNhbnMtc2VyaWYiCiAgICAgICAgICBmb250LXdlaWdodD0iOTAwIgogICAgICAgICAgZm9udC1zaXplPSI4OCIKICAgICAgICAgIGxldHRlci1zcGFjaW5nPSIyIgogICAgICAgICAgZmlsbD0idXJsKCNncmVlbkZpbGwpIj5SQU5HRTwvdGV4dD4KCiAgICA8IS0tIFJBTkdFIOKAlCBnb2xkIHN0cm9rZSAtLT4KICAgIDx0ZXh0IHg9IjIyOCIgeT0iMTgzIgogICAgICAgICAgZm9udC1mYW1pbHk9IidCYXJsb3cgQ29uZGVuc2VkJywgJ0FyaWFsIE5hcnJvdycsIHNhbnMtc2VyaWYiCiAgICAgICAgICBmb250LXdlaWdodD0iOTAwIgogICAgICAgICAgZm9udC1zaXplPSI4OCIKICAgICAgICAgIGxldHRlci1zcGFjaW5nPSIyIgogICAgICAgICAgZmlsbD0ibm9uZSIKICAgICAgICAgIHN0cm9rZT0idXJsKCNnb2xkQmV2ZWwpIgogICAgICAgICAgc3Ryb2tlLXdpZHRoPSIxLjUiPlJBTkdFPC90ZXh0PgoKICA8L2c+CgogIDwhLS0g4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQCiAgICAgICBURVhUIOKAlCAiQ08uIiAoc21hbGxlciwgYm90dG9tIHJpZ2h0KQogICAgICAg4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQIC0tPgoKICA8ZyBmaWx0ZXI9InVybCgjdGV4dEdsb3cpIj4KCiAgICA8dGV4dCB4PSI2MTYiIHk9IjE4MyIKICAgICAgICAgIGZvbnQtZmFtaWx5PSInQmFybG93IENvbmRlbnNlZCcsICdBcmlhbCBOYXJyb3cnLCBzYW5zLXNlcmlmIgogICAgICAgICAgZm9udC13ZWlnaHQ9IjkwMCIKICAgICAgICAgIGZvbnQtc2l6ZT0iNTIiCiAgICAgICAgICBmaWxsPSJ1cmwoI2dvbGRCZXZlbCkiCiAgICAgICAgICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxLjUsIDIpIj5DTy48L3RleHQ+CgogICAgPHRleHQgeD0iNjE2IiB5PSIxODMiCiAgICAgICAgICBmb250LWZhbWlseT0iJ0JhcmxvdyBDb25kZW5zZWQnLCAnQXJpYWwgTmFycm93Jywgc2Fucy1zZXJpZiIKICAgICAgICAgIGZvbnQtd2VpZ2h0PSI5MDAiCiAgICAgICAgICBmb250LXNpemU9IjUyIgogICAgICAgICAgZmlsbD0idXJsKCNnb2xkQmV2ZWwpIj5DTy48L3RleHQ+CgogICAgPHRleHQgeD0iNjE2IiB5PSIxODMiCiAgICAgICAgICBmb250LWZhbWlseT0iJ0JhcmxvdyBDb25kZW5zZWQnLCAnQXJpYWwgTmFycm93Jywgc2Fucy1zZXJpZiIKICAgICAgICAgIGZvbnQtd2VpZ2h0PSI5MDAiCiAgICAgICAgICBmb250LXNpemU9IjUyIgogICAgICAgICAgZmlsbD0ibm9uZSIKICAgICAgICAgIHN0cm9rZT0idXJsKCNnb2xkU3Ryb2tlKSIKICAgICAgICAgIHN0cm9rZS13aWR0aD0iMSI+Q08uPC90ZXh0PgoKICA8L2c+Cgo8L3N2Zz4K'

export function generateWelcomeEmailHTML() {
  const logoSrc = `data:image/svg+xml;base64,${LOGO_B64}`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to DownRange</title>
</head>
<body style="margin:0;padding:0;background:#1a1a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">

  <!-- WRAPPER -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;padding:40px 20px;">
  <tr><td align="center">
  <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">

    <!-- LOGO HEADER -->
    <tr>
      <td style="background:#111111;padding:48px 40px 40px;text-align:center;border-bottom:3px solid #c8922a;">
        <img src="${logoSrc}" width="340" height="100" alt="DownRange" style="display:block;margin:0 auto;max-width:100%;height:auto;" />
        <p style="margin:20px 0 0;font-size:11px;letter-spacing:3px;color:#666;text-transform:uppercase;font-family:'Courier New',monospace;">PRESS KIT &middot; MEDIA RESOURCES &middot; 2026</p>
      </td>
    </tr>

    <!-- HERO HEADLINE -->
    <tr>
      <td style="background:#1a1a1a;padding:60px 48px 40px;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;color:#c8922a;text-transform:uppercase;font-weight:700;">YOU&rsquo;RE IN</p>
        <h1 style="margin:0 0 28px;font-size:48px;font-weight:900;color:#ffffff;line-height:1.1;font-family:'Arial Black','Arial',sans-serif;text-transform:uppercase;letter-spacing:-1px;">WELCOME TO<br><span style="color:#c8922a;">DOWNRANGE.</span></h1>
        <p style="margin:0;font-size:16px;color:#cccccc;line-height:1.8;">DownRange is an independent firearms and Second Amendment intelligence platform headquartered in Washington State. You&rsquo;re now receiving curated intelligence every morning&mdash;direct to your inbox.</p>
      </td>
    </tr>

    <!-- STATS BAR -->
    <tr>
      <td style="background:#111111;padding:0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="25%" style="padding:40px 20px;text-align:center;border-right:1px solid #2a2a2a;">
              <p style="margin:0 0 6px;font-size:42px;font-weight:900;color:#c8922a;font-family:'Arial Black','Courier New',monospace;line-height:1;">50</p>
              <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;color:#ffffff;text-transform:uppercase;font-weight:700;">STATES COVERED</p>
              <p style="margin:0;font-size:11px;color:#666;">Full legal + carry law database</p>
            </td>
            <td width="25%" style="padding:40px 20px;text-align:center;border-right:1px solid #2a2a2a;">
              <p style="margin:0 0 6px;font-size:42px;font-weight:900;color:#c8922a;font-family:'Arial Black','Courier New',monospace;line-height:1;">30+</p>
              <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;color:#ffffff;text-transform:uppercase;font-weight:700;">MFG TRACKED</p>
              <p style="margin:0;font-size:11px;color:#666;">Real-time release monitoring</p>
            </td>
            <td width="25%" style="padding:40px 20px;text-align:center;border-right:1px solid #2a2a2a;">
              <p style="margin:0 0 6px;font-size:42px;font-weight:900;color:#c8922a;font-family:'Arial Black','Courier New',monospace;line-height:1;">24/7</p>
              <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;color:#ffffff;text-transform:uppercase;font-weight:700;">NEWS INTEL</p>
              <p style="margin:0;font-size:11px;color:#666;">AI-powered, 15-min refresh</p>
            </td>
            <td width="25%" style="padding:40px 20px;text-align:center;">
              <p style="margin:0 0 6px;font-size:42px;font-weight:900;color:#c8922a;font-family:'Arial Black','Courier New',monospace;line-height:1;">2026</p>
              <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;color:#ffffff;text-transform:uppercase;font-weight:700;">FOUNDED</p>
              <p style="margin:0;font-size:11px;color:#666;">Washington State, USA</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- OUR MISSION -->
    <tr>
      <td style="background:#1a1a1a;padding:60px 48px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <!-- LEFT: MISSION -->
            <td width="55%" style="padding-right:40px;vertical-align:top;">
              <p style="margin:0 0 12px;font-size:10px;letter-spacing:2px;color:#c8922a;text-transform:uppercase;font-weight:700;">OUR MISSION</p>
              <h2 style="margin:0 0 24px;font-size:30px;font-weight:900;color:#ffffff;line-height:1.1;font-family:'Arial Black','Arial',sans-serif;text-transform:uppercase;">GROW THE SECOND AMENDMENT<br>COMMUNITY ACROSS AMERICA</h2>
              <p style="margin:0 0 16px;font-size:14px;color:#cccccc;line-height:1.8;">DownRange exists because gun owners, dealers, instructors, and Second Amendment advocates deserve a dedicated intelligence platform&mdash;one that covers what matters without apology, without a corporate agenda.</p>
              <p style="margin:0;font-size:14px;color:#cccccc;line-height:1.8;">We built DownRange to be the first place you check when a law changes in your state, when a new firearm drops, or when a court hands down a Second Amendment decision.</p>
            </td>
            <!-- RIGHT: FOUNDER -->
            <td width="45%" style="vertical-align:top;">
              <div style="background:#111111;border-left:3px solid #c8922a;padding:28px 24px;">
                <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;color:#c8922a;text-transform:uppercase;font-weight:700;">ABOUT THE FOUNDER</p>
                <h3 style="margin:8px 0 4px;font-size:20px;font-weight:900;color:#ffffff;font-family:'Arial Black','Arial',sans-serif;text-transform:uppercase;">DJ CAVALCANTI</h3>
                <p style="margin:0 0 16px;font-size:10px;letter-spacing:1px;color:#888;text-transform:uppercase;">FOUNDER &amp; PUBLISHER &middot; DOWNRANGE</p>
                <p style="margin:0 0 12px;font-size:13px;color:#cccccc;line-height:1.7;">A Second Amendment advocate, firearms enthusiast, and entrepreneur based in Washington State. Founded DownRange in 2026 with the conviction that the gun community deserves better media.</p>
                <a href="mailto:dj@downrangeco.com" style="font-size:12px;color:#c8922a;text-decoration:none;font-weight:600;">dj@downrangeco.com</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- WHAT YOU GET -->
    <tr>
      <td style="background:#111111;padding:48px;">
        <p style="margin:0 0 32px;font-size:11px;letter-spacing:3px;color:#c8922a;text-transform:uppercase;font-weight:700;">WHAT YOU GET</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="50%" style="padding:0 20px 28px 0;vertical-align:top;">
              <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#ffffff;">Breaking Alerts</p>
              <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">Immediate notification on major news and developments</p>
            </td>
            <td width="50%" style="padding:0 0 28px 0;vertical-align:top;">
              <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#ffffff;">Daily Briefing</p>
              <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">Curated news, legislation, and analysis every morning</p>
            </td>
          </tr>
          <tr>
            <td width="50%" style="padding:0 20px 28px 0;vertical-align:top;border-top:1px solid #2a2a2a;padding-top:20px;">
              <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#ffffff;">State Laws</p>
              <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">Comprehensive CCW, NFA, and regulatory tracking by state</p>
            </td>
            <td width="50%" style="padding:0 0 28px 0;vertical-align:top;border-top:1px solid #2a2a2a;padding-top:20px;">
              <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#ffffff;">Market Intel</p>
              <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">Ammunition pricing, deals, and industry trends</p>
            </td>
          </tr>
          <tr>
            <td width="50%" style="padding:20px 20px 0 0;vertical-align:top;border-top:1px solid #2a2a2a;">
              <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#ffffff;">Legal Updates</p>
              <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">Supreme Court decisions, litigation tracking, and case analysis</p>
            </td>
            <td width="50%" style="padding:20px 0 0 0;vertical-align:top;border-top:1px solid #2a2a2a;">
              <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#ffffff;">Threat Assessment</p>
              <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">Real-time monitoring of threats to your rights</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="background:#1a1a1a;padding:60px 48px;text-align:center;">
        <a href="https://downrangeco.com" style="display:inline-block;background:#c8922a;color:#000000;padding:16px 48px;text-decoration:none;font-weight:900;letter-spacing:2px;text-transform:uppercase;font-size:13px;font-family:'Arial Black','Arial',sans-serif;">VISIT DOWNRANGE &rarr;</a>
        <p style="margin:32px 0 0;font-size:13px;color:#555;font-family:'Courier New',monospace;letter-spacing:1px;">Stay armed. Stay informed. <strong style="color:#888;">Stay DownRange.</strong></p>
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="background:#111111;padding:32px 48px;border-top:1px solid #2a2a2a;text-align:center;">
        <p style="margin:0 0 12px;font-size:11px;color:#555;">Questions? <a href="mailto:dj@downrangeco.com" style="color:#c8922a;text-decoration:none;">Contact us</a> &mdash; <a href="https://downrangeco.com/unsubscribe" style="color:#c8922a;text-decoration:none;">Unsubscribe</a></p>
        <p style="margin:0;font-size:10px;color:#444;font-family:'Courier New',monospace;">DownRange Co. | Second Amendment Intelligence Platform<br>Your source for unfiltered news and analysis.</p>
      </td>
    </tr>

  </table>
  </td></tr>
  </table>

</body>
</html>`
}
export function generateNewsletterHTML(data, isTest = false) {
  const { news, blogs, deals } = data
  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui; background: #0a0a0a; color: #e0e0e0; }
    .wrapper { background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%); padding: 40px 20px; }
    .container { max-width: 680px; margin: 0 auto; background: #0f0f0f; border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden; }
    
    /* HEADER */
    .header { background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%); padding: 50px 40px; text-align: center; border-bottom: 3px solid #c8922a; }
    ${isTest ? '.test-badge { display: inline-block; background: #ff6b6b; color: #fff; padding: 6px 12px; border-radius: 3px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px; }' : ''}
    .logo-container { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 20px; }
    .logo { font-family: 'Courier New', monospace; font-size: 42px; font-weight: 900; letter-spacing: 6px; color: #c8922a; text-shadow: 0 2px 8px rgba(200,146,42,0.3); }
    .divider-gold { width: 60px; height: 2px; background: #c8922a; }
    .date-badge { display: inline-block; background: rgba(200,146,42,0.15); color: #c8922a; padding: 8px 16px; border-radius: 4px; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-top: 16px; font-family: 'Courier New', monospace; }
    
    /* CONTENT */
    .content { padding: 40px; }
    .intro { font-size: 16px; color: #b0b0b0; line-height: 1.6; margin-bottom: 40px; }
    .intro strong { color: #c8922a; }
    
    /* SECTION */
    .section { margin-bottom: 50px; }
    .section-title { font-size: 18px; font-weight: 800; color: #fff; font-family: 'Courier New', monospace; letter-spacing: 2px; text-transform: uppercase; padding-bottom: 12px; border-bottom: 2px solid #c8922a; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
    .section-icon { font-size: 24px; }
    
    /* NEWS CARDS */
    .news-grid { display: flex; flex-direction: column; gap: 20px; }
    .news-card { background: rgba(200,146,42,0.08); border-left: 4px solid #c8922a; padding: 20px; border-radius: 4px; transition: all 0.3s; text-decoration: none; color: inherit; display: block; }
    .news-rank { display: inline-block; background: #c8922a; color: #000; width: 28px; height: 28px; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 700; font-size: 12px; margin-bottom: 8px; }
    .news-cat { font-size: 11px; color: #c8922a; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 6px; }
    .news-title { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 10px; line-height: 1.4; }
    .news-summary { font-size: 14px; color: #a0a0a0; line-height: 1.6; margin-bottom: 12px; }
    .news-meta { font-size: 12px; color: #777; display: flex; gap: 16px; }
    .news-meta a { color: #c8922a; text-decoration: none; font-weight: 600; }
    
    /* BLOG CARDS */
    .blog-grid { display: flex; flex-direction: column; gap: 18px; }
    .blog-card { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 4px; overflow: hidden; transition: all 0.3s; text-decoration: none; color: inherit; display: block; }
    .blog-image { width: 100%; height: 120px; background: linear-gradient(135deg, #2a2a2a, #1a1a1a); display: flex; align-items: center; justify-content: center; color: #666; font-size: 48px; }
    .blog-content { padding: 16px; }
    .blog-title { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 8px; line-height: 1.3; }
    .blog-summary { font-size: 13px; color: #a0a0a0; line-height: 1.5; margin-bottom: 10px; }
    .blog-cta { color: #c8922a; font-weight: 600; margin-top: 8px; }
    
    /* DEALS */
    .deals-grid { display: flex; flex-direction: column; gap: 16px; }
    .deal-card { background: #1a1a1a; border: 1px solid #c8922a; border-radius: 4px; padding: 16px; display: flex; gap: 16px; transition: all 0.3s; text-decoration: none; color: inherit; }
    .deal-badge { background: #c8922a; color: #000; padding: 4px 10px; border-radius: 3px; font-size: 11px; font-weight: 700; white-space: nowrap; height: fit-content; }
    .deal-info { flex: 1; }
    .deal-title { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 6px; }
    .deal-retailer { font-size: 12px; color: #999; margin-bottom: 8px; }
    .deal-price { font-size: 18px; font-weight: 800; color: #c8922a; }
    .deal-original { font-size: 12px; color: #777; text-decoration: line-through; margin-left: 8px; }
    .deal-savings { font-size: 12px; color: #4ade80; font-weight: 600; }
    
    /* FOOTER */
    .footer { background: #0a0a0a; padding: 30px 40px; text-align: center; border-top: 1px solid #2a2a2a; }
    .footer-text { font-size: 12px; color: #666; line-height: 1.8; font-family: 'Courier New', monospace; }
    .footer-link { color: #c8922a; text-decoration: none; font-weight: 600; }
    .footer-divider { height: 1px; background: linear-gradient(90deg, transparent, #2a2a2a, transparent); margin: 20px 0; }
    .cta-button { display: inline-block; background: #c8922a; color: #000; padding: 12px 30px; text-decoration: none; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; font-size: 12px; border-radius: 4px; margin: 20px auto; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- HEADER -->
      <div class="header">
        ${isTest ? '<div class="test-badge">⚠️ TEST EMAIL</div>' : ''}
        <div class="logo-container">
          <div class="divider-gold"></div>
          <div class="logo">DR</div>
          <div class="divider-gold"></div>
        </div>
        <div style="font-family: 'Courier New', monospace; font-size: 13px; letter-spacing: 2px; color: #999; text-transform: uppercase;">Daily Intelligence Brief</div>
        <div class="date-badge">${todayDate}</div>
      </div>

      <!-- CONTENT -->
      <div class="content">
        <div class="intro">
          <strong>Stay Armed. Stay Informed.</strong> Your curated Second Amendment intelligence briefing. The latest 2A news, policy analysis, market data, and industry trends—delivered to your inbox.
        </div>

        <!-- TOP NEWS SECTION -->
        ${news && news.length > 0 ? `
        <div class="section">
          <div class="section-title">
            <span class="section-icon">🔴</span>
            TOP BREAKING NEWS
          </div>
          <div class="news-grid">
            ${news.map((article, idx) => `
            <a href="https://downrangeco.com/news/${article.slug?.current || '#'}" class="news-card" style="color: #e0e0e0;">
              <div class="news-rank">${idx + 1}</div>
              <div class="news-cat">${article.category || 'NEWS'}</div>
              <div class="news-title">${article.title}</div>
              <div class="news-summary">${article.summary || article.title} Learn what this means for your rights and the 2A community.</div>
              <div class="news-meta">
                <span>${new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <a href="https://downrangeco.com/news/${article.slug?.current || '#'}">READ FULL ANALYSIS →</a>
              </div>
            </a>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- LATEST ARTICLES SECTION -->
        ${blogs && blogs.length > 0 ? `
        <div class="section">
          <div class="section-title">
            <span class="section-icon">✍️</span>
            LATEST ARTICLES
          </div>
          <div class="blog-grid">
            ${blogs.map(article => `
            <a href="https://downrangeco.com/blog/${article.slug?.current || '#'}" class="blog-card" style="color: #e0e0e0;">
              <div class="blog-image">📰</div>
              <div class="blog-content">
                <div class="blog-title">${article.title}</div>
                <div class="blog-summary">${article.summary || 'Deep dive into the latest in firearms, legislation, and 2A news.'}</div>
                <div class="blog-cta">READ ARTICLE →</div>
              </div>
            </a>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- DEALS SECTION -->
        ${deals && deals.length > 0 ? `
        <div class="section">
          <div class="section-title">
            <span class="section-icon">🔥</span>
            HOTTEST DEALS
          </div>
          <div class="deals-grid">
            ${deals.slice(0, 4).map(deal => {
              const savings = deal.savings ? Math.round(deal.savings) : Math.round((1 - deal.dealPrice / deal.originalPrice) * 100)
              return `
              <a href="${deal.url || '#'}" class="deal-card" style="color: #e0e0e0;">
                <div class="deal-badge">-${savings}%</div>
                <div class="deal-info">
                  <div class="deal-title">${deal.title}</div>
                  <div class="deal-retailer">${deal.retailer}</div>
                  <div>
                    <span class="deal-price">$${deal.dealPrice?.toFixed(2) || 'N/A'}</span>
                    <span class="deal-original">$${deal.originalPrice?.toFixed(2) || 'N/A'}</span>
                    <span class="deal-savings">SAVE $${(deal.originalPrice - deal.dealPrice).toFixed(2)}</span>
                  </div>
                </div>
              </a>
              `
            }).join('')}
          </div>
          <a href="https://downrangeco.com/deals" class="cta-button" style="color: #000;">BROWSE ALL DEALS</a>
        </div>
        ` : ''}
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <div class="footer-text">
          <strong>DownRange Daily</strong> — Your Second Amendment Intelligence Portal
          <div class="footer-divider"></div>
          <div style="margin: 12px 0;">
            <a href="https://downrangeco.com" class="footer-link">Visit DownRange</a> • 
            <a href="https://downrangeco.com/unsubscribe" class="footer-link">Unsubscribe</a> • 
            <a href="https://downrangeco.com/contact" class="footer-link">Contact</a>
          </div>
          <div style="margin-top: 16px; color: #555;">
            You're receiving this because you subscribed to DownRange Daily.<br>
            Stay armed. Stay informed. Stay DownRange.
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `
}
