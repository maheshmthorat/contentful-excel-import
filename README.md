# 📊 Contentful Excel Import

<p>
  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8buri8TAq9hRdlFa7_9xCejlF_-AWjXFDNg&s" alt="Contentful Logo" width="300"/>
</p>

Easily import content from **Excel (.xlsx)** files into your **Contentful CMS** 🚀.  
This tool helps automate bulk content creation without manual entry.

---

## ✨ Features

- 📥 Import structured data from **Excel**
- 🔄 Map Excel fields to **Contentful fields**
- ⚡ Bulk content creation made easy
- 🛡️ Error handling for invalid entries

---

## 🛠️ Installation

1. Clone this repo

```bash
gh repo clone maheshmthorat/contentful-excel-import
cd contentful-excel-import
```

2. Install dependencies

```bash
npm install
```

---

## 🚀 Usage

1. Prepare your Excel file following the format in **Import-Format.xlsx**.
2. Add your Contentful credentials in `.env`.
3. Run the script:

```bash
node app.js
```

---

## 📊 Excel Format Example

| Title         | Slug          | Published Date <br>(format: DD-MM-YYYY HH:MM:SS) | Excerpt                 | Featured Image <br>(format: https://) | Editor Content     | Tags       | Content Type ID<br>(contentTypeId) |
| ------------- | ------------- | ------------------------------------------------ | ----------------------- | ------------------------------------- | ---------- | ---------- | ---------------- |
| Sample Title  | sample-title  | 16-09-2025 12:15                              | This is a short excerpt | https://example.com/featured.jpg      | &lt;p&gt;Editor&lt;/p&gt;   | tech, ai   | news             |
| Another Title | another-title | 16-09-2025 12:15                              | Another excerpt         | https://example.com/featured2.jpg     | &lt;p&gt;Editor&lt;/p&gt;   | design, ux | news      |

---

## 💻 Output

```
Tag created: tech
Tag created: ai
Added - news__ID=>XXX7BLkhpgPUm8fq4Ox63nitr
Tag created: design
Tag created: ux
Added - news__ID=>XXX2iM429jgUuftaofWM4zAmc

✅ Import completed!
Total Excel Records: 2
Total Successfully Added: 2
```
---

## 📂 Project Structure

```
├── 📄 app.js             # Main script for import logic
├── 📄 Import-Format.xlsx # Sample Excel format
├── 📄 package.json       # Dependencies & scripts
└── 📄 .gitignore         # Ignored files
```

---


## ⚡ Roadmap

- ✅ Basic Excel → Contentful import
- 🔜 Support for **multiple content types**
- 🔜 CLI with advanced mapping options

---

## 🤝 Contributing

Pull requests are welcome! 🙌

---

## 👨‍💻 Author

**Mahesh Thorat**  
[GitHub](https://github.com/maheshmthorat/)

---

## 🫰 Donate
[buymeacoffee](https://buymeacoffee.com/maheshmthorat)

---

## 📜 License

MIT License © 2025

---

<p align="center">Made with ❤️ using <b>Contentful</b> & Excel</p>
