const mammoth = require('mammoth')

mammoth.extractRawText({path: 'C:/Users/james/Downloads/PS6 Specs.docx'})
  .then(r => {
    const lines = r.value.split('\n').filter(l => l.trim())
    lines.forEach((l, i) => console.log(i + ': ' + l))
  })
  .catch(console.error)
