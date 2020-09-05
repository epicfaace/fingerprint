https://verdaccio.org/docs/en/github-actions

wget https://registry.npmjs.org/react-jsonschema-form/-/react-jsonschema-form-1.8.1.tgz
zgrep -F -f strings.txt react-jsonschema-form-1.8.1.tgz

zgrep -a "uiSchema order list contains extraneous " react-jsonschema-form-1.8.1.tgz

comm -12 output/strings-https:--root.treehacks.com-dist-vendors~app.js.txt output/strings-https:--unpkg.com-react-jsonschema-form@1.8.0-dist-react-jsonschema-form.js.txt | wc -l
2019

comm -12 output/strings-https:--root.treehacks.com-dist-vendors~app.js.txt output/strings-https:--unpkg.com-react-jsonschema-form@1.8.1-dist-react-jsonschema-form.js.txt | wc -l
2009

comm -12 output/strings-https:--root.treehacks.com-dist-vendors~app.js.txt output/strings-https:--unpkg.com-@rjsf-core@2.2.0-dist-react-jsonschema-form.js.txt | wc -l
1986

comm -12 output/strings-https:--root.treehacks.com-dist-vendors~app.js.txt output/strings-https:--unpkg.com-lodash@4.17.19-lodash.min.js.txt | wc -l
126

comm -12 output/strings-https:--root.treehacks.com-dist-vendors~app.js.txt output/strings-https:--unpkg.com-lodash@4.17.15-lodash.min.js.txt | wc -l
93