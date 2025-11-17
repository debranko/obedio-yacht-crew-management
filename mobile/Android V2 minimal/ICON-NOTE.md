# App Icon Note

## Missing Icons

Aplikacija koristi **default Android ikone**. Za produkcijsku verziju, potrebno je kreirati custom ikone.

## Potrebne Ikone

Kreiraj ikone u sledećim dimenzijama:

```
app/src/main/res/
├── mipmap-mdpi/
│   ├── ic_launcher.png (48x48)
│   └── ic_launcher_round.png (48x48)
├── mipmap-hdpi/
│   ├── ic_launcher.png (72x72)
│   └── ic_launcher_round.png (72x72)
├── mipmap-xhdpi/
│   ├── ic_launcher.png (96x96)
│   └── ic_launcher_round.png (96x96)
├── mipmap-xxhdpi/
│   ├── ic_launcher.png (144x144)
│   └── ic_launcher_round.png (144x144)
└── mipmap-xxxhdpi/
    ├── ic_launcher.png (192x192)
    └── ic_launcher_round.png (192x192)
```

## Kako Kreirati Ikone

### Opcija 1: Android Asset Studio

1. Otvori Android Studio
2. Right-click na `res` folder
3. New → Image Asset
4. Izaberi tip: Launcher Icons (Adaptive and Legacy)
5. Upload PNG fajl (512x512 preporučeno)
6. Generate

### Opcija 2: Online Tool

Koristi: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html

1. Upload logo (512x512 PNG)
2. Podesi padding i boje
3. Download ZIP
4. Extract u `res` folder

### Opcija 3: Manual

Koristi Photoshop/Figma/GIMP:
- Kreiraj 512x512 master ikonu
- Resize za svaku dimenziju
- Export kao PNG

## Dizajn Preporuke

**Logo ideja za Obedio Minimal:**
- Simbol: Connection icon (npr. linked nodes, signal waves)
- Boja: Plava (#1976D2) - predstavlja tehnologiju i pouzdanost
- Stil: Minimalistički, flat design
- Oblik: Kružni (za compatibility)

**Primer koncepata:**
1. **Tri povezana kruga** (predstavljaju WebSocket, MQTT, API)
2. **Signal ikonica** sa checkmark-om
3. **Cloud sa checklist-om**
4. **Wireless signal + yacht silueta**

## Current State

Trenutno aplikacija koristi **default plavu ikonoografiju** definisanu u:
- `ic_launcher_background.xml` - plava boja (#1976D2)
- `ic_launcher.xml` i `ic_launcher_round.xml` - adaptive icon wrapper

**Za testiranje ovo je dovoljno**, ali za produkciju treba custom design.

## Adaptive Icons

Android 8.0+ koristi adaptive icons koji se sastoje od:
- **Background layer** - pozadina (color ili drawable)
- **Foreground layer** - glavni logo (SVG ili PNG)

Adaptivni ikone dozvoljavaju sistemu da:
- Kreira različite oblike (krug, kvadrat, squircle)
- Animira ikonu
- Dodaje shadow effects

## Quick Fix - Default Icon

Ako ne želiš custom ikonu odmah, koristi Android Studio wizard:
1. Right-click `res` folder
2. New → Image Asset
3. Clip Art → Izaberi "Cloud" ili "Wifi"
4. Background color: #1976D2
5. Finish

Ovo će kreirati sve potrebne ikone automatski.
