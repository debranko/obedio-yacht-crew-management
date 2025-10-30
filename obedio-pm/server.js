const http = require('http');
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const formidable = require('formidable').formidable;

const PORT = 3333;
const DATA_FILE = path.join(__dirname, 'tasks.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Load environment variables
require('dotenv').config().parsed || {};
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

// Initialize Anthropic client
let anthropic = null;
if (ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
}

// Initialize data file
function initData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ tasks: [], nextId: 1 }, null, 2));
  }
}

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API Routes
  if (req.url === '/api/tasks' && req.method === 'GET') {
    // Get all tasks
    initData();
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(data);
    return;
  }

  if (req.url === '/api/tasks' && req.method === 'POST') {
    // Add new task
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const newTask = JSON.parse(body);
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

      const task = {
        id: data.nextId++,
        description: newTask.description,
        category: newTask.category,
        status: 'pending',
        priority: newTask.priority || 'medium',
        order: data.tasks.length,
        createdAt: new Date().toISOString(),
        subtasks: []
      };

      data.tasks.push(task);
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(task));
    });
    return;
  }

  if (req.url.startsWith('/api/tasks/') && req.method === 'PUT') {
    // Update task
    const taskId = parseInt(req.url.split('/')[3]);
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const updates = JSON.parse(body);
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      const task = data.tasks.find(t => t.id === taskId);

      if (task) {
        Object.assign(task, updates);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(task));
      } else {
        res.writeHead(404);
        res.end('Task not found');
      }
    });
    return;
  }

  if (req.url.startsWith('/api/tasks/') && req.method === 'DELETE') {
    // Delete task
    const taskId = parseInt(req.url.split('/')[3]);
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const index = data.tasks.findIndex(t => t.id === taskId);

    if (index !== -1) {
      data.tasks.splice(index, 1);
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
      res.writeHead(200);
      res.end('Deleted');
    } else {
      res.writeHead(404);
      res.end('Task not found');
    }
    return;
  }

  if (req.url === '/api/ai/chat' && req.method === 'POST') {
    // AI Chat endpoint
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { message, categories } = JSON.parse(body);

        if (!anthropic) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            response: 'AI nije konfigurisan. Dodaj ANTHROPIC_API_KEY u .env fajl. Trenutno koristim fallback logiku.',
            tasks: []
          }));
          return;
        }

        // Build categories list for the prompt
        const categoriesList = Object.entries(categories)
          .map(([key, cat]) => `- ${key}: ${cat.name} ${cat.icon}`)
          .join('\n');

        // Call Claude API
        const response = await anthropic.messages.create({
          model: process.env.AI_MODEL || 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          system: "Ti si TODO list asistent. Tvoja JEDINA svrha je kreiranje task-ova za project management. NE ODGOVARAJ na bilo koja druga pitanja. NE PRIČAJ o bilo čemu što nije task. Ako korisnik pita bilo šta što nije vezano za kreiranje task-a, ljubazno podsetite ga da si TODO asistent.",
          messages: [{
            role: 'user',
            content: `DOSTUPNE KATEGORIJE:
${categoriesList}

PRIORITETI:
- urgent: Hitno, odmah, asap
- high: Važno, visok prioritet
- medium: Normalno (default)
- low: Može kasnije

KORISNIK KAŽE: "${message}"

TVOJ ZADATAK: Analiziraj poruku i kreiraj taskove. Ako poruka NIJE o kreiranju taska, odgovori samo: "Ja sam TODO asistent. Mogu da kreiram taskove. Reci mi šta treba da uradiš!"

Vrati JSON u ovom formatu:
{
  "response": "Kratak odgovor na srpskom (max 2 rečenice)",
  "tasks": [
    {
      "title": "Kratak naslov (2-5 reči, bez 'treba', 'moram')",
      "description": "Detaljniji opis taska (opciono, može biti prazan string ako je naslov dovoljan)",
      "category": "ključ kategorije",
      "priority": "urgent/high/medium/low",
      "url": "https://link-za-kupovinu-ili-pretragu" // OBAVEZNO ako traži kupovinu/naručivanje/pretragu
    }
  ],
  "newCategory": { "key": "lowercase_bez_space", "name": "Display Name", "icon": "emoji" } // samo ako traži novu kategoriju
}

PRAVILA:
1. **NASLOV**: Generiši kratak, jasan naslov (2-5 reči). Primeri:
   - "Treba mi da poručim Arduino" → title: "Poručiti Arduino Mega"
   - "Hitno popraviti login bug" → title: "Fix Login Bug"
   - "Napraviti PCB schematic" → title: "PCB Schematic"
2. Ako poruka sadrži " i ", " pa ", " onda ", " zatim" - podeli na VIŠE taskova
3. Prepoznaj kategoriju: login/bug/api→webapp, pcb/prototip→pcb, kućište→case, marketing→marketing, web→website, metstrade→metstrade
4. Prioritet: hitno/urgent/odmah/asap→urgent, važno/high→high, kasnije/low→low, ostalo→medium
5. Očisti title i description: bez "treba mi", "moram", "hoću", "želim"
6. Novo kategorija SAMO ako kaže "kreiraj kategoriju [ime]"
7. Ako pitanje NIJE o tasku → tasks: [] i response sa podsetnikem
8. **SHOPPING**: Ako traži kupovinu/naručivanje/pretragu proizvoda:
   - Dodaj "url" sa Google search linkom: https://www.google.com/search?q=naziv+proizvoda+kupovina
   - Ili direktan link za AliExpress/Amazon ako je poznat proizvod
   - Primeri:
     * "Arduino Mega" → https://www.google.com/search?q=Arduino+Mega+2560+buy
     * "PCB komponente" → https://www.google.com/search?q=PCB+components+buy+online
     * "3D printer filament" → https://www.google.com/search?q=3D+printer+PLA+filament+buy

Vrati SAMO validan JSON. Ništa pre ili posle JSON-a.`
          }]
        });

        const aiResponse = response.content[0].text;
        let result;

        try {
          result = JSON.parse(aiResponse);
        } catch (e) {
          // Fallback ako AI ne vrati čist JSON
          result = {
            response: aiResponse,
            tasks: []
          };
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        console.error('AI Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'AI greška: ' + error.message,
          response: 'Nisam mogao da obradim poruku. Možeš li da preciziraš?',
          tasks: []
        }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = req.url === '/' ? './web/index.html' : './web' + req.url;
  filePath = path.join(__dirname, filePath);

  const extname = path.extname(filePath);
  const contentType = mimeTypes[extname] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 OBEDIO Project Manager is running!`);
  console.log(`\n   Open in browser: http://localhost:${PORT}`);
  console.log(`\n   Press Ctrl+C to stop\n`);
});
