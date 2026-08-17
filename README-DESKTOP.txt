Audit LBC Foret - version desktop Electron v3.29.0
===================================================

Contenu
-------
Cette archive contient :
- l'application web stabilisee v3.28.17, embarquee dans le dossier app/ ;
- un wrapper Electron dans electron/ ;
- une configuration electron-builder pour generer un .exe Windows ;
- un script build-windows.bat pour compiler depuis un PC Windows.

Lancer en mode developpement sur un PC avec Node.js
---------------------------------------------------
1. Installer Node.js LTS si necessaire.
2. Ouvrir un terminal dans ce dossier.
3. Executer : npm install
4. Executer : npm start

Generer un .exe Windows
-----------------------
Option simple : double-cliquer sur build-windows.bat.

Equivalent terminal :
1. npm install
2. npm run check
3. npm run dist:win

Les fichiers generes seront dans dist/ :
- un installateur .exe ;
- une version portable .exe.

Export PDF desktop
------------------
Dans la version Electron, le bouton Export PDF utilise une boite d'enregistrement native.
Le nom propose est celui genere par l'application : Audit_LBC_[Methode]_[NomProjet]_[Date].pdf.

Stockage des donnees
--------------------
Les donnees restent locales au poste, via le stockage local de la fenetre Electron.
Pour une diffusion large, il faudra conserver une procedure d'export/import ou de sauvegarde.

Important
---------
Cette archive ne contient pas les dependances node_modules ni les binaires Electron.
Ils sont telecharges par npm install sur le poste de build.
