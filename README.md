# 📅 Planificador Docent Dinàmic (LOMLOE) - v3.0

Aplicació Web Progressiva (PWA) dissenyada per a la gestió, seqüenciació i reprogramació en cascada de sessions lectives segons el currículum oficial **LOMLOE** a Catalunya (Secundària i Batxillerat).

## 🚀 Novetats de la Versió v3.0 (Actualització de Disseny i Estructura)

A partir de la imatge de referència aportada, s'ha fet un redisseny visual profund buscant un equilibri **modern, minimalista i atractiu**, allunyant-se d'estils purament infantils/juvenils sense caure en la fredor d'un programari corporatiu d'empresa:

* **Identitat Visual Renovada:** S'adopta una paleta basada en fons nets (`#f8fafc`), vores suaus i targetes amb cantonades molt arrodonides (`rounded-2xl`).
* **Targetes de Validació Estil "Checklist":** S'integren indicadors d'estat visuals que canvien de color de fons (`bg-emerald-50`, `bg-rose-50`) i vores en funció de les dades reals, simulant el mòdul de diagnòstic de les captures de referència.
* **Tipografia i Contrast:** Ús de tipografies amb pesos contrastats (`font-black`, `font-medium`) per facilitar una lectura ràpida en mobilitat dins de l'aula.
* **Seccions de Rúbriques i Control en Blocs Clars:** Divisió de la pantalla en mòduls independents i flotants amb ombres suaus (`shadow-xs`).

## 🛠️ Modificacions Tècniques Implementades

1.  **Interfície d'Alta de Matèries:** Unificat en un bloc superior elegant. Permet seleccionar Etapa, Matèria oficial del currículum de manera automàtica i assignar la lletra del Grup (A-F).
2.  **Motor de Desplaçament de Sessions (Core Cascading):** Si es prem el botó "Vaga / Incidència", la sessió teòrica d'aquell dia es tanca com a "Cancel·lada" i s'empeny automàticament tot el temari programat cap al següent dia lectiu de la setmana.
3.  **Localització Total:** Tot el sistema utilitza dates i missatges nadius en català (`ca-ES`).
4.  **Emmagatzematge en Local (IndexedDB):** No requereix servidors externs; les dades es guarden de manera 100% privada al navegador del docent.

## 📦 Estructura del Projecte

* `index.html`: Estructura semàntica i maquetació amb el nou disseny modern.
* `app.js`: Lògica del catàleg LOMLOE, gestió d'esdeveniments i motor de projecció.
* `db.js`: Transaccions locals i persistència amb IndexedDB.
* `sw.js`: Service Worker per a suport complet offline dins de l'institut.
* `manifest.json`: Configuració per a la instal·lació com a aplicació nativa de mòbil/escriptori.
