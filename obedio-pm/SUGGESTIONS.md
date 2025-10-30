# Predlozi za dodatne kategorije

Ovde su predlozi za još kategorija koje možeš dodati u budućnosti, u zavisnosti od tvoje potrebe:

## 🔧 Moguće dodatne kategorije

### 1. **Manufacturing** (Proizvodnja)
- Mass production planiranje
- Quality control
- Supplier management
- Cost optimization
- Production timeline

### 2. **Testing** (Testiranje)
- Beta testing program
- User testing sessions
- Quality assurance
- Bug tracking koji nije direktno vezan za softver
- Field testing

### 3. **Documentation** (Dokumentacija)
- User manuals
- API documentation
- Installation guides
- Video tutorials
- Training materials

### 4. **Sales** (Prodaja)
- Sales strategy
- Customer inquiries
- Quotations
- Partnership opportunities
- Distribution channels

### 5. **Legal** (Pravno)
- Patents i trademark
- Regulatory compliance (CE, FCC, etc.)
- Contracts sa kontraktorima
- Insurance
- Legal documents

### 6. **Finance** (Finansije)
- Budget tracking
- Expense reports
- Investment planning
- Crowdfunding (ako planirate)
- Grant applications

### 7. **Support** (Podrška)
- Customer support setup
- FAQ preparation
- Troubleshooting guides
- Warranty policy
- RMA process

### 8. **R&D** (Research & Development)
- Feature research
- Competitor analysis
- New technology exploration
- Future product versions
- Innovation ideas

## 🎯 Kako dodati novu kategoriju

Ako odlučiš da dodaš novu kategoriju:

1. Otvori [index.js](index.js) i dodaj u `CATEGORIES` objekat:
```javascript
newcategory: { name: 'New Category', icon: '🔥', color: '\x1b[91m' }
```

2. Dodaj opis u `showCategories()` funkciju

3. Ažuriraj error message i help komandu

4. Napravi novi folder: `mkdir newcategory`

5. Dodaj README.md u taj folder

## 💡 Kada dodati novu kategoriju?

Dodaj novu kategoriju kada:
- Imaš više od 5-10 taskova iz iste oblasti
- Trebaju ti specifični fajlovi za tu oblast
- Kategorizacija ti pomaže da se organizuješ
- Tim raste i treba jasna podela odgovornosti

**Nemoj dodavati previše kategorija odjednom** - bolje je krenuti sa manjim brojem i dodavati po potrebi!
