const express = require("express");
const fs= require('fs');
const path=require('path');
const sass=require('sass');
const sharp=require('sharp');
const {Client}=require('pg');

var client= new Client({database:"CoffeeTeaRia",
        user:"franci",
        password:"castraveteroz",
        host:"localhost",
        port:5432});
client.connect();

client.query("select * from lab8_10", function(err, res){
    console.log("Eroare BD: ", err);
    console.log("Rezultat BD: ", res);
})

/*
app.get("/produse",function(req, res){

    console.log(req.query)
    //TO DO query pentru a selecta toate produsele
    //TO DO se adauaga filtrarea dupa tipul produsului
    //TO DO se selecteaza si toate valorile din enum-ul categ_prajitura
    let conditieWhere="";
    if(req.query.tip)
    conditieWhere=`where tip_produs='${req.query.tip}'`
        client.query("select * from prajituri" +conditieWhere , function( err, rez){
            console.log(300)
            if(err){
                console.log(err);
                renderError(res, 2);
            }
            else
                res.render("pagini/produse", {produse:rez.rows, optiuni:[]});
        });


});


app.get("/produs/:id",function(req, res){
    console.log(req.params);
   
    client.query(" TO DO ", function( err, rezultat){
        if(err){
            console.log(err);
            afisareEroare(res, 2);
        }
        else
            res.render("pagini/produs", {prod:""});
    });
});
*/

obGlobal={
    obErori:null,
    obImagini:null,
    folderScss: path.join(__dirname, "Resurse/SCSS"),
    folderCss: path.join(__dirname, "Resurse/CSS"),
    folderBackup: path.join(__dirname, "backup")
}

app= express();
console.log("Folder proiect", __dirname);
console.log("Cale fisier", __filename);
console.log("Director de lucru", process.cwd());


vectorFoldere=["temp", "temp1", "backup"]
for (let folder of vectorFoldere){
    //let caleFolder=__dirname+"/"+folder;
    let caleFolder=path.join(__dirname, folder)
    if (! fs.existsSync(caleFolder)){
        fs.mkdirSync(caleFolder);
    }

}

function compileazaScss(caleScss, caleCss){
    console.log("cale:",caleCss);
    if(!caleCss){
        // TO DO
        // let vectorCale=caleScss.split("\\")
        // let numeFisExt=vectorCale[vectorCale.length-1];
        let numeFisExt=path.basename(caleScss);
        let numeFis=numeFisExt.split(".")[0]   /// "a.scss"  -> ["a","scss"]
        caleCss=numeFis+".css";
    }
    
    if (!path.isAbsolute(caleScss))
        caleScss=path.join(obGlobal.folderScss,caleScss )
    if (!path.isAbsolute(caleCss))
        caleCss=path.join(obGlobal.folderCss,caleCss )
    
    
    // la acest punct avem cai absolute in caleScss si  caleCss
    //TO DO
    // let vectorCale=caleCss.split("\\");
    // let numeFisCss=vectorCale[vectorCale.length-1]
    let caleResBackup=path.join(obGlobal.folderBackup, "Resurse/CSS");
    if (!fs.existsSync(caleResBackup))
        fs.mkdirSync(caleResBackup, {recursive:true});
    let numeFisCss=path.basename(caleCss);
    if (fs.existsSync(caleCss)){
        fs.copyFileSync(caleCss, path.join(obGlobal.folderBackup,"Resurse/CSS",numeFisCss ))// +(new Date()).getTime()
    }
    rez=sass.compile(caleScss, {"sourceMap":true});
    fs.writeFileSync(caleCss,rez.css)
    //console.log("Compilare SCSS",rez);
}
//compileazaScss("a.scss");

vFisiere=fs.readdirSync(obGlobal.folderScss);
for(let numeFis of vFisiere){
    if(path.extname(numeFis)==".scss"){
        compileazaScss(numeFis);
    }
}

fs.watch(obGlobal.folderScss, function(eveniment, numeFis){
    console.log(eveniment, numeFis);
    if(eveniment=="change" || eveniment=="rename"){
        let caleCompleta=path.join(obGlobal.folderScss, numeFis);
        if(fs.existsSync(caleCompleta)){
            compileazaScss("a.scss");
        }
    }
}) //verifica daca in fisier au survenit schimbari

app.set("view engine","ejs");

app.use("/Resurse", express.static(__dirname+"/Resurse"));
app.use("/node_modules", express.static(__dirname+"/node_modules"));

app.use(/^\/Resurse(\/[a-zA-Z0-9]*)*$/, function(req,res){
    afisareEroare(res,403);
});


app.get("/favicon.ico", function(req,res){
    res.sendFile(__dirname+"/Resurse/favicon.ico");
})

app.get("/ceva", function(req, res){
    console.log("cale:",req.url)
    res.send("<h1>altceva</h1> ip:"+req.ip);
})


app.get(["/index","/","/home" ], function(req, res){
    res.render("Pagini/index");
})

app.get(["/index", "/", "/despre"],function(req,res){
    res.render("Pages/despre");
});


// ^\w+\.ejs$
app.get("/*.ejs",function(req, res){
    afisareEroare(res,400);
})

app.get("/*",function(req, res){
    try{
        res.render("Pagini"+req.url, function(err, rezRandare){
            if(err){
                console.log(err);
                if(err.message.startsWith("Failed to lookup view"))
                //afisareEroare(res,{_identificator:404, _titlu:"ceva"});
                    afisareEroare(res,404);
                else
                    afisareEroare(res);
            }
            else{
                console.log(rezRandare);
                res.send(rezRandare);
            }
        } );
    } catch(err){
        if(err.message.startsWith("Cannot find module"))
        //afisareEroare(res,{_identificator:404, _titlu:"ceva"});
            afisareEroare(res,404);
    }
})

function initImagini(){
    var continut= fs.readFileSync(__dirname+"/Resurse/JSON/galerie.json").toString("utf-8");

    obGlobal.obImagini=JSON.parse(continut);
    let vImagini=obGlobal.obImagini.imagini;

    let caleAbs=path.join(__dirname,obGlobal.obImagini.cale_galerie);
    let caleAbsMediu=path.join(__dirname,obGlobal.obImagini.cale_galerie, "mediu");
    if (!fs.existsSync(caleAbsMediu))
        fs.mkdirSync(caleAbsMediu);

    //for (let i=0; i< vErori.length; i++ )
    for (let imag of vImagini){
        [numeFis, ext]=imag.fisier.split(".");
        let caleFisAbs=path.join(caleAbs,imag.fisier);
        let caleFisMediuAbs=path.join(caleAbsMediu, numeFis+".webp");
        sharp(caleFisAbs).resize(400).toFile(caleFisMediuAbs);
        imag.fisier_mediu=path.join("/", obGlobal.obImagini.cale_galerie, "mediu",numeFis+".webp" )
        imag.fisier=path.join("/", obGlobal.obImagini.cale_galerie, imag.fisier )
        //eroare.imagine="/"+obGlobal.obErori.cale_baza+"/"+eroare.imagine;
    }
}
initImagini();

function initErori(){
    var continut= fs.readFileSync(__dirname+"/Resurse/JSON/erori.json").toString("utf-8");
    //console.log(continut);
    obGlobal.obErori=JSON.parse(continut);
    let vErori=obGlobal.obErori.info_erori;
    
    //for (let i=0; i< vErori.length; i++ )
    for (let eroare of vErori){
        eroare.imagine="/"+obGlobal.obErori.cale_baza+"/"+eroare.imagine;
    }
}
initErori();

/*
function initImagini(){
    var continut= fs.readFileSync(__dirname+"/Resurse/JSON/galerie.json").toString("utf-8");
    obGlobal.obImagini=JSON.parse(continut);
    let vImagini=obGlobal.obImagini.imagini;
    let caleAbs=path.join(__dirname, obGlobal.obImagini.cale_galerie);
    let caleMediu=path.join(caleAbs, "mediu");//folder in care vom crea imag de dim medie
    if (! fs.existsSync(caleMediu)){
        fs.mkdirSync(caleMediu);
    }
    let caleMic=path.join(caleAbs, "mic");//folder in care vom crea imag de dim medie
    if (! fs.existsSync(caleMic)){
        fs.mkdirSync(caleMic);
    }

    //for (let i=0; i< vErori.length; i++ )
    for (let imag of vImagini){
        [numeFis, extensie]=imag.fisier.split("."); //pune ce e inainte de punct in prima var si ce e dupa in a doua
        let caleAbsFisier=path.join(caleAbs, imag.fisier);
        let caleAbsFisierMediu=path.join(caleMediu, numeFis)+".webp";
        sharp(caleAbsFisier).resize(400).toFile(caleAbsFisierMediu);
        let caleAbsFisierMic=path.join(caleMic, numeFis)+".webp";
        sharp(caleAbsFisier).resize(200).toFile(caleAbsFisierMic);
        imag.fisier_mediu="/"+path.join(obGlobal.obImagini.cale_galerie,"mediu", numeFis+".webp");
        imag.fisier="/"+obGlobal.obImagini.cale_galerie+"/"+imag.fisier;
    }
}
initImagini();

*/

/*
daca  programatorul seteaza titlul, se ia titlul din argument
daca nu e setat, se ia cel din json
daca nu avem titluk nici in JSOn se ia titlul de valoarea default
idem pentru celelalte
*/

//function afisareEroare(res, {_identificator, _titlu, _text, _imagine}={} ){
function afisareEroare(res, _identificator, _titlu="titlu default", _text, _imagine ){
    let vErori=obGlobal.obErori.info_erori;
    let eroare=vErori.find(function(elem) {return elem.identificator==_identificator;} )
    if(eroare){
        let titlu1= _titlu=="titlu default" ? (eroare.titlu || _titlu) : _titlu;
        let text1= _text || eroare.text;
        let imagine1= _imagine || eroare.imagine;
        if(eroare.status)
            res.status(eroare.identificator).render("Pagini/eroare", {titlu:titlu1, text:text1, imagine:imagine1});
        else
            res.render("Pagini/eroare", {titlu:titlu1, text:text1, imagine:imagine1});
    }
    else{
        let errDef=obGlobal.obErori.eroare_default;
        res.render("Pagini/eroare", {titlu:errDef.titlu, text:errDef.text, imagine:obGlobal.obErori.cale_baza+"/"+errDef.imagine});
    }
    

}


app.listen(8080);
console.log("Serverul a pornit");