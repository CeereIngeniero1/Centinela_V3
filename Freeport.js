const puppeteer = require("puppeteer");
const fs = require("fs");
require("dotenv").config();
const colors = require("colors");
const nodemailer = require("nodemailer");
const { Console } = require("console");
const { keyboard, mouse, Key, clipboard } = require("@nut-tree-fork/nut-js");

const os = require("os");
const { url } = require("inspector");
require('dotenv').config();

const EquiposGenerales = JSON.parse(process.env.EQUIPOS_GENERALES);
const Informacion_Empresas = JSON.parse(process.env.Informacion_Empresas);
const Informacion_Economica = JSON.parse(process.env.Informacion_Economica);
const Geologos = JSON.parse(process.env.Geologos);
const Contadores = JSON.parse(process.env.Contadores);
// console.log(Informacion_Empresas);
// console.log(Informacion_Economica);
// console.log(EquiposGenerales);
// console.log(Geologos);
// console.log(Contadores);


const NombreEquipo = os.hostname();
console.log(" Nombre del equipo: ", NombreEquipo);

const EquipoActual = EquiposGenerales[NombreEquipo];
console.log(" Equipo Actual: ", EquipoActual);

// Actualizado
const Empresa = "Freeport"; // Collective, NegoYMetales, Freeport, Provenza
const Datos_Empresa = Informacion_Empresas[Empresa];
const Datos_Economicos = Informacion_Economica[Empresa];
const Datos_Geologos = Geologos[Empresa];
const Datos_Contadores = Contadores[Empresa];
// console.log(" Datos de Datos_Geologos: ", Datos_Geologos);
// console.log(" Datos de Datos_Contadores: ", Datos_Contadores);
const user1 = Datos_Empresa.Codigo;
const pass1 = Datos_Empresa.Contraseña;
const user2 = '83949';
const pass2 = 'JorgeC2025.';
const Agente = 0;
var EnviarCorreosParaPestanas = 0;
var contreapertura = 0;
var ContadorVueltas = 0;
var Band = 0;
var ComparacionCeldas = "";
var areaFiltrado;

//console.log( Informacion_Empresas[Empresa]);

Pagina();
async function Pagina() {
  var Pines = fs.readFileSync(
    "Pin.txt",
    "utf-8",
    (prueba = (error, datos) => {
      if (error) {
        throw error;
      } else {
        console.log(datos);
      }
    })
  );
  for (let i = 0; i < Pines.length; i++) {
    if (Pines.substring(i + 1, i + 4) == "N2:") {
      console.log(Pines.substring(i + 1, i + 4));
      Pin = Pines.substring(i + 4, i + 31);
      break;
    }
  }



  const browser = await puppeteer.launch({
    //executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    executablePath:
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    // Reemplaza con la ruta real a tu Google Chrome
    headless: false,
    args: [
      "--start-maximized",
    ],
    devtools: false,
  });

  Mineria(browser, Pin);
}

async function Login(page) {
  await page.setViewport({ width: 1368, height: 620 });
  await page.goto("https://annamineria.anm.gov.co/sigm/");

  let user = Agente == 0 ? user1 : user2;
  let pass = Agente == 0 ? pass1 : pass2;

  try {
    console.log(user);
    console.log(pass);
    await page.type("#username", user);
    await page.type("#password", pass);

    // page.click("#loginButton");
  } catch (ex) {
    console.log("Entro en el catch");
  }

  // page.setDefaultTimeout(0);
   try {
    await page.waitForNavigation({
      waitUntil: "networkidle0",
      timeout: 10000, // 5 segundos en milisegundos
    });
  } catch (error) {
    if (error instanceof puppeteer.errors.TimeoutError) {
      console.log("La navegación tardó más de 5 segundos.");

    } else {
      console.log(error);

    }
  }
}

async function RadicarPropuesta(page) {


  try {
    await page.waitForFunction(
      url => window.location.href === url,
      { timeout: 6000 },
      "https://annamineria.anm.gov.co/sigm/index.html#/extDashboard"
    );

    await page.waitForSelector('span.menu-item-parent.ng-binding', { visible: true });
    const solicitudes = await page.$x('//span[contains(.,"Solicitudes")]');
    await solicitudes[1].click();

    // const [solicitudes] = await page.waitForXPath(
    //   '//span[contains(.,"Solicitudes")]',
    //   { visible: true, timeout: 15000 }
    // );

    // await solicitudes.click();

  } catch (error) {
    console.error("No se pudo encontrar o hacer clic en 'Solicitudes':", error);
  }

  const lblRadicar = await page.$x(
    '//a[contains(.,"Radicar solicitud de propuesta de contrato de concesión")]'
  );
  await lblRadicar[0].click();
}

async function Agente_Selecion_Empresa(page) {
  // await page.waitForTimeout(2000);
  await page.waitForTimeout(500);
  await page.waitForSelector("#submitterPersonOrganizationNameId", {
    visible: true,
  });

  await page.evaluate(
    () =>
      (document.getElementById("submitterPersonOrganizationNameId").value = "")
  );
  // await page.type("#submitterPersonOrganizationNameId", "76966");
  await page.type("#submitterPersonOrganizationNameId", Datos_Empresa.Codigo);
  // await page.waitForTimeout(300000);
  console.log(`${Datos_Empresa.Nombre} (${Datos_Empresa.Codigo})`);
  try {
    await page.waitForFunction(
      (Datos_Empresa) => {
        const el = document.querySelector(
          // 'a[title*="COLLECTIVE MINING LIMITED SUCURSAL COLOMBIA (76966)"]'
          `a[title*="${Datos_Empresa.Nombre} (${Datos_Empresa.Codigo})"]`
        );
        return (
          el &&
          // el.innerText.includes("COLLECTIVE MINING LIMITED SUCURSAL COLOMBIA")
          el.innerText.includes(Datos_Empresa.Nombre)
        );
      },
      { timeout: 5000 },
      Datos_Empresa
    ); // espera máximo 10s
  } catch (error) {

  }



  await page.keyboard.press("Enter");

}

async function seleccionar_Pin(page, Pin, Veces) {
  await page.waitForTimeout(900);
  page.setDefaultTimeout(0);
  await page.waitForSelector('select[id="pinSlctId"]');
  const selectPin = await page.$('select[id="pinSlctId"]');
  await selectPin.type(Pin);
  console.log(Pin);

  /* VALIDAR SI EL PIN ESTÁ PRÓXIMO A VENCERSE */
  // Capturar todas las opciones de un select
  const allOptions = await page.evaluate((select) => {
    const options = Array.from(select.options); // Convierte las opciones a un array
    return options.map((option) => option.textContent); // Retorna un array con el texto de cada opción
  }, selectPin);

  console.log("Todas las opciones:", allOptions);

  const closestDateOption = await page.evaluate(() => {
    const select = document.querySelector("select");

    const monthMap = {
      ENE: "01",
      FEB: "02",
      MAR: "03",
      ABR: "04",
      MAY: "05",
      JUN: "06",
      JUL: "07",
      AGO: "08",
      SEP: "09",
      OCT: "10",
      NOV: "11",
      DIC: "12",
    };

    const options = Array.from(select.options).map((option) => {
      const text = option.textContent; // Ejemplo: "20241108074024, 08/DIC/2024"
      const dateText = text.split(", ")[1]; // Extraer la fecha: "08/DIC/2024"

      const [day, monthName, year] = dateText.split("/");
      const month = monthMap[monthName];
      const formattedDate = new Date(`${year}-${month}-${day}`);

      return { text, date: formattedDate };
    });

    const now = new Date();

    const differences = options.map((option) => {
      const diff = Math.abs(option.date - now);
      return { text: option.text, diff }; // Retornar la diferencia y el texto
    });

    console.log("Diferencias calculadas:", differences);

    // Reducir para encontrar la fecha más cercana
    const closest = options.reduce((prev, curr) => {
      return Math.abs(curr.date - now) < Math.abs(prev.date - now)
        ? curr
        : prev;
    });

    return closest.text;
  });

  console.log("Opción más cercana a la fecha actual:", closestDateOption);
  const input = closestDateOption;
  /* FIN => VALIDACIÓN SI EL PIN ESTÁ PRÓXIMO A VENCERSE */

  await page.waitForXPath('//span[contains(.,"Continuar")]');
  const continPin = await page.$x('//span[contains(.,"Continuar")]');
  //if(Veces == 1){
  await continPin[1].click();
  //}

  await page.waitForTimeout(1000);

  try {
    // Intentar esperar el botón 5 segundos
    await page.waitForSelector('button[ng-class="settings.buttonClasses"]', {
      timeout: 3000,
    });
    console.log("✅ Botón encontrado, ejecutando acción principal...");
    // await page.click('button[ng-class="settings.buttonClasses"]');
    await Minerales(page);
  } catch (error) {
    console.log(
      "⏱ No apareció el botón en 5 segundos, ejecutando lógica del PIN..."
    );

    // 👉 Aquí va tu bloque PIN acomodado
    if (Veces == 0) {
      await seleccionar_Pin(page, Pin, 1);
    }
  }

  return { closestDateOption, input };
}

async function Minerales(page) {
  // await page.waitForSelector('button[ng-class="settings.buttonClasses"]');
  page.evaluate(() => {
    document.querySelector('[ng-class="settings.buttonClasses"]').click();
    var elementos = document.getElementsByClassName("ng-binding ng-scope");
    let Minerales = [
      "COBRE",
      "cobre",
      "PLATA",
      "Plata",
      "ORO",
      "oro"
    ];
    let elementosConMinerales = [];

    // ITERA SOBRE TODOS LOS ELEMENTOS CON CLASE (ng-binding ng-scope)
    for (let i = 0; i < elementos.length; i++) {
      let elemento = elementos[i];
      let agregarElemento = false;

      // ITERA SOBRE TODOS LOS VALORES DE LA LISTA MINERALES
      for (let c = 0; c < Minerales.length; c++) {
        // VERIFICA SI EL TEXTO DEL ELEMENTO CONTIENE EXACTAMENTE EL MINERAL EN PROCESO DE LA LISTA DE MINERALES
        if (
          elemento.textContent.includes(Minerales[c]) &&
          elemento.textContent.split(/\s+/).includes(Minerales[c])
        ) {
          agregarElemento = true;
          break;
        }
      }

      // SI SE CUMPLE AGREGARELEMENTO === TRUE, SE AGREGA EL ELEMENTO A LA LISTA ELEMENTOSCONMINERALES
      if (agregarElemento) {
        elementosConMinerales.push(elemento);
      }
    }

    // SE HACE CLIC SOBRE TODOS LOS VALORES CONTENIEDOS EN LA LISTA ELEMENTOSCONMINERALES
    for (let i = 0; i < elementosConMinerales.length; i++) {
      elementosConMinerales[i].click();
    }
    /* FIN FIN FIN */
  });
}

async function MonitorearAreas(page, IdArea, Celda, Area) {
  //console.log(IdArea, Aviso, Celda, Comas);

  const AreaCeldas = Area[0].split(',').map(celda => celda.trim());
  await page.evaluate(
    ({ Area }) => {
      document.querySelector('[id="cellIdsTxtId"]').value = Area.join("");
      angular
        .element(document.getElementById("cellIdsTxtId"))
        .triggerHandler("change");
    },
    { Area }
  );

  DetallesCompletos = {
    IdArea: IdArea,
    Celda: Celda,
    Area: Area,
    AreaCeldas: AreaCeldas,
  };

  return DetallesCompletos;
}

async function Detalles_de_area(page) {
  const continDetallesdelArea2 = await page.$x('//a[contains(.,"área")]');
  await continDetallesdelArea2[4].click();

  const grupoEtnicoYN = await page.$('input[value="N"]');
  await grupoEtnicoYN.click();
}

async function Informacion_tecnica(page) {
  try {
    const btnInfoTecnica = await page.$x('//a[contains(.,"Información t")]');
    await btnInfoTecnica[0].click();

    await page.evaluate(() => {
      document.querySelector('[id="yearOfExecutionId0"]').value = "number:1";

      angular
        .element(document.getElementById("yearOfExecutionId0"))
        .triggerHandler("change");

      document.querySelector('[id="yearOfDeliveryId0"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfDeliveryId0"))
        .triggerHandler("change");

      document.querySelector('[id="laborSuitabilityId0"]').value = "IIG";

      angular
        .element(document.getElementById("laborSuitabilityId0"))
        .triggerHandler("change");

      //Contactos con la comunidad y enfoque social

      document.querySelector('[id="yearOfExecutionId1"]').value = "number:1";

      angular
        .element(document.getElementById("yearOfExecutionId1"))
        .triggerHandler("change");

      document.querySelector('[id="yearOfDeliveryId1"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfDeliveryId1"))
        .triggerHandler("change");

      document.querySelector('[id="laborSuitabilityId1"]').value = "TSCA";

      angular
        .element(document.getElementById("laborSuitabilityId1"))
        .triggerHandler("change");

      //Base topográfica del área

      document.querySelector('[id="yearOfExecutionId2"]').value = "number:1";

      angular
        .element(document.getElementById("yearOfExecutionId2"))
        .triggerHandler("change");

      document.querySelector('[id="yearOfDeliveryId2"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfDeliveryId2"))
        .triggerHandler("change");

      document.querySelector('[id="laborSuitabilityId2"]').value = "IIG";

      angular
        .element(document.getElementById("laborSuitabilityId2"))
        .triggerHandler("change");

      //Cartografía geológica

      document.querySelector('[id="yearOfExecutionId3"]').value = "number:1";

      angular
        .element(document.getElementById("yearOfExecutionId3"))
        .triggerHandler("change");

      document.querySelector('[id="yearOfDeliveryId3"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfDeliveryId3"))
        .triggerHandler("change");

      document.querySelector('[id="laborSuitabilityId3"]').value = "IIG";

      angular
        .element(document.getElementById("laborSuitabilityId3"))
        .triggerHandler("change");

      //Excavación de trincheras y apiques

      document.querySelector('[id="yearOfExecutionId4"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfExecutionId4"))
        .triggerHandler("change");

      document.querySelector('[id="yearOfDeliveryId4"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfDeliveryId4"))
        .triggerHandler("change");

      document.querySelector('[id="laborSuitabilityId4"]').value = "IIG";

      angular
        .element(document.getElementById("laborSuitabilityId4"))
        .triggerHandler("change");

      //Geoquímica y otros análisis

      document.querySelector('[id="yearOfExecutionId5"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfExecutionId5"))
        .triggerHandler("change");

      document.querySelector('[id="yearOfDeliveryId5"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfDeliveryId5"))
        .triggerHandler("change");

      document.querySelector('[id="laborSuitabilityId5"]').value = "IIG";

      angular
        .element(document.getElementById("laborSuitabilityId5"))
        .triggerHandler("change");

      //Geofísica

      document.querySelector('[id="yearOfExecutionId6"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfExecutionId6"))
        .triggerHandler("change");

      document.querySelector('[id="yearOfDeliveryId6"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfDeliveryId6"))
        .triggerHandler("change");

      document.querySelector('[id="laborSuitabilityId6"]').value = "IIG";

      angular
        .element(document.getElementById("laborSuitabilityId6"))
        .triggerHandler("change");

      //Estudio de dinámica fluvial del cauce

      document.querySelector('[id="yearOfExecutionId7"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfExecutionId7"))
        .triggerHandler("change");

      document.querySelector('[id="yearOfDeliveryId7"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfDeliveryId7"))
        .triggerHandler("change");

      document.querySelector('[id="laborSuitabilityId7"]').value = "IIG";

      angular
        .element(document.getElementById("laborSuitabilityId7"))
        .triggerHandler("change");

      // Características hidrológicas y sedimentológicas del cauce

      document.querySelector('[id="yearOfExecutionId8"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfExecutionId8"))
        .triggerHandler("change");

      document.querySelector('[id="yearOfDeliveryId8"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfDeliveryId8"))
        .triggerHandler("change");

      document.querySelector('[id="laborSuitabilityId8"]').value = "IIG";

      angular
        .element(document.getElementById("laborSuitabilityId8"))
        .triggerHandler("change");

      //Pozos y Galerías Exploratorias

      document.querySelector('[id="yearOfExecutionId9"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfExecutionId9"))
        .triggerHandler("change");

      document.querySelector('[id="yearOfDeliveryId9"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfDeliveryId9"))
        .triggerHandler("change");

      document.querySelector('[id="laborSuitabilityId9"]').value = "IIG";

      angular
        .element(document.getElementById("laborSuitabilityId9"))
        .triggerHandler("change");

      //Perforaciones profundas

      document.querySelector('[id="yearOfExecutionId10"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfExecutionId10"))
        .triggerHandler("change");

      document.querySelector('[id="yearOfDeliveryId10"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfDeliveryId10"))
        .triggerHandler("change");

      document.querySelector('[id="laborSuitabilityId10"]').value = "IIG";

      angular
        .element(document.getElementById("laborSuitabilityId10"))
        .triggerHandler("change");

      //Muestreo y análisis de calidad

      document.querySelector('[id="yearOfExecutionId11"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfExecutionId11"))
        .triggerHandler("change");

      document.querySelector('[id="yearOfDeliveryId11"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfDeliveryId11"))
        .triggerHandler("change");

      document.querySelector('[id="laborSuitabilityId11"]').value = "IIG";

      angular
        .element(document.getElementById("laborSuitabilityId11"))
        .triggerHandler("change");

      //Estudio geotécnico

      document.querySelector('[id="yearOfExecutionId12"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfExecutionId12"))
        .triggerHandler("change");

      document.querySelector('[id="yearOfDeliveryId12"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfDeliveryId12"))
        .triggerHandler("change");

      document.querySelector('[id="laborSuitabilityId12"]').value = "IIG";

      angular
        .element(document.getElementById("laborSuitabilityId12"))
        .triggerHandler("change");

      //Estudio Hidrológico

      document.querySelector('[id="yearOfExecutionId13"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfExecutionId13"))
        .triggerHandler("change");

      document.querySelector('[id="yearOfDeliveryId13"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfDeliveryId13"))
        .triggerHandler("change");

      document.querySelector('[id="laborSuitabilityId13"]').value = "IIG";

      angular
        .element(document.getElementById("laborSuitabilityId13"))
        .triggerHandler("change");

      //Estudio Hidrogeológico

      document.querySelector('[id="yearOfExecutionId14"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfExecutionId14"))
        .triggerHandler("change");

      document.querySelector('[id="yearOfDeliveryId14"]').value = "number:2";

      angular
        .element(document.getElementById("yearOfDeliveryId14"))
        .triggerHandler("change");

      document.querySelector('[id="laborSuitabilityId14"]').value = "IIG";

      angular
        .element(document.getElementById("laborSuitabilityId14"))
        .triggerHandler("change");

      //Evaluación del modelo geológico

      document.querySelector('[id="yearOfExecutionId15"]').value = "number:3";

      angular
        .element(document.getElementById("yearOfExecutionId15"))
        .triggerHandler("change");

      document.querySelector('[id="yearOfDeliveryId15"]').value = "number:3";

      angular
        .element(document.getElementById("yearOfDeliveryId15"))
        .triggerHandler("change");

      document.querySelector('[id="laborSuitabilityId15"]').value = "IIG";

      angular
        .element(document.getElementById("laborSuitabilityId15"))
        .triggerHandler("change");

      //Actividades exploratorias adicionales (Se describe en el anexo Tecnico que se allegue)

      document.querySelector('[id="yearOfExecutionId16"]').value = "number:3";

      angular
        .element(document.getElementById("yearOfExecutionId16"))
        .triggerHandler("change");

      document.querySelector('[id="yearOfDeliveryId16"]').value = "number:3";

      angular
        .element(document.getElementById("yearOfDeliveryId16"))
        .triggerHandler("change");

      document.querySelector('[id="laborSuitabilityId16"]').value = "IIG";

      angular
        .element(document.getElementById("laborSuitabilityId16"))
        .triggerHandler("change");

      // Actividades Ambientales etapa de exploración

      //Selección optima de Sitios de Campamentos y Helipuertos

      angular
        .element(document.getElementById("envYearOfDeliveryId0"))
        .triggerHandler("change");

      document.querySelector('[id="envLaborSuitabilityId0"]').value = "MULT";

      angular
        .element(document.getElementById("envLaborSuitabilityId0"))
        .triggerHandler("change");

      //Manejo de Aguas Lluvias

      angular
        .element(document.getElementById("envYearOfDeliveryId1"))
        .triggerHandler("change");

      document.querySelector('[id="envLaborSuitabilityId1"]').value = "MULT";

      angular
        .element(document.getElementById("envLaborSuitabilityId1"))
        .triggerHandler("change");

      //Manejo de Aguas Residuales Domesticas

      angular
        .element(document.getElementById("envYearOfDeliveryId2"))
        .triggerHandler("change");

      document.querySelector('[id="envLaborSuitabilityId2"]').value = "MULT";

      angular
        .element(document.getElementById("envLaborSuitabilityId2"))
        .triggerHandler("change");

      //Manejo de Cuerpos de Agua

      angular
        .element(document.getElementById("envYearOfDeliveryId3"))
        .triggerHandler("change");

      document.querySelector('[id="envLaborSuitabilityId3"]').value = "MULT";

      angular
        .element(document.getElementById("envLaborSuitabilityId3"))
        .triggerHandler("change");

      //Manejo de Material Particulado y Gases

      angular
        .element(document.getElementById("envYearOfDeliveryId4"))
        .triggerHandler("change");

      document.querySelector('[id="envLaborSuitabilityId4"]').value = "MULT";

      angular
        .element(document.getElementById("envLaborSuitabilityId4"))
        .triggerHandler("change");

      //Manejo del Ruido

      angular
        .element(document.getElementById("envYearOfDeliveryId5"))
        .triggerHandler("change");

      document.querySelector('[id="envLaborSuitabilityId5"]').value = "MULT";

      angular
        .element(document.getElementById("envLaborSuitabilityId5"))
        .triggerHandler("change");

      // Manejo de Combustibles

      angular
        .element(document.getElementById("envYearOfDeliveryId6"))
        .triggerHandler("change");

      document.querySelector('[id="envLaborSuitabilityId6"]').value = "MULT";

      angular
        .element(document.getElementById("envLaborSuitabilityId6"))
        .triggerHandler("change");

      //Manejo de Taludes

      angular
        .element(document.getElementById("envYearOfDeliveryId7"))
        .triggerHandler("change");

      document.querySelector('[id="envLaborSuitabilityId7"]').value = "MULT";

      angular
        .element(document.getElementById("envLaborSuitabilityId7"))
        .triggerHandler("change");

      //Manejo de Accesos

      angular
        .element(document.getElementById("envYearOfDeliveryId8"))
        .triggerHandler("change");

      document.querySelector('[id="envLaborSuitabilityId8"]').value = "MULT";

      angular
        .element(document.getElementById("envLaborSuitabilityId8"))
        .triggerHandler("change");

      // Manejo de Residuos Solidos

      angular
        .element(document.getElementById("envYearOfDeliveryId9"))
        .triggerHandler("change");

      document.querySelector('[id="envLaborSuitabilityId9"]').value = "MULT";

      angular
        .element(document.getElementById("envLaborSuitabilityId9"))
        .triggerHandler("change");

      //Adecuación y Recuperación de Sitios de Uso Temporal

      angular
        .element(document.getElementById("envYearOfDeliveryId10"))
        .triggerHandler("change");

      document.querySelector('[id="envLaborSuitabilityId10"]').value = "MULT";

      angular
        .element(document.getElementById("envLaborSuitabilityId10"))
        .triggerHandler("change");

      //Manejo de Fauna y Flora

      angular
        .element(document.getElementById("envYearOfDeliveryId11"))
        .triggerHandler("change");

      document.querySelector('[id="envLaborSuitabilityId11"]').value = "IFEB";

      angular
        .element(document.getElementById("envLaborSuitabilityId11"))
        .triggerHandler("change");

      //Plan de Gestión Social

      angular
        .element(document.getElementById("envYearOfDeliveryId12"))
        .triggerHandler("change");

      document.querySelector('[id="envLaborSuitabilityId12"]').value = "TSCA";

      angular
        .element(document.getElementById("envLaborSuitabilityId12"))
        .triggerHandler("change");

      //capacitación de Personal

      angular
        .element(document.getElementById("envYearOfDeliveryId13"))
        .triggerHandler("change");

      document.querySelector('[id="envLaborSuitabilityId13"]').value = "MULT";

      angular
        .element(document.getElementById("envLaborSuitabilityId13"))
        .triggerHandler("change");

      //Contratación de Mano de Obra no Calificada

      angular
        .element(document.getElementById("envYearOfDeliveryId14"))
        .triggerHandler("change");

      document.querySelector('[id="envLaborSuitabilityId14"]').value = "MULT";

      angular
        .element(document.getElementById("envLaborSuitabilityId14"))
        .triggerHandler("change");

      //Rescate Arqueológico

      angular
        .element(document.getElementById("envYearOfDeliveryId15"))
        .triggerHandler("change");

      document.querySelector('[id="envLaborSuitabilityId15"]').value = "ARQ";

      angular
        .element(document.getElementById("envLaborSuitabilityId15"))
        .triggerHandler("change");

      //Manejo de Hundimientos

      angular
        .element(document.getElementById("envYearOfDeliveryId16"))
        .triggerHandler("change");

      document.querySelector('[id="envLaborSuitabilityId16"]').value = "MULT";

      angular
        .element(document.getElementById("envLaborSuitabilityId16"))
        .triggerHandler("change");
    });
    return true;
  } catch (error) {
    return false;
  }

}
async function Profesionales(page, Eventos) {


  // SELECCIÓN DE PROFESIONALES => CONTADOR(ES), GEÓLOGO(S), INGENIERO(S) GEÓLOGO(S), INGENIERO(S) DE MINAS
  // ==============================================================================
  console.log("INICIA LA SELECCIÓN DE LOS PROFESIONALES");
  console.log(
    "================================================================"
  );
  // let profesionales = [
  //   { tipo: "Geólogo", nombres: ["Oscar Javier Pinilla Reyes (73619)"] },
  //   //  { tipo: "Ingeniero Geólogo", nombres: [""]},
  //   //  { tipo: "Ingeniero de Minas", nombres: [""]}
  // ];

  await seleccionar_Profesional(Datos_Geologos, page, 1, Eventos);

  // Hacer clic en el botón "Agregar"
  const addProfesional = await page.$x('//span[contains(.,"Agregar")]');
  await addProfesional[0].click();

  console.log(
    "================================================================"
  );
  console.log("FIN DE LA SELECCIÓN DE LOS PROFESIONALES");
  // =============================================================================
  if (Eventos == 0) {
    // Acepta terminos y da clic en continuar
    await page.click("#technicalCheckboxId");
  }

  const btnInfoEconomica = await page.$x(
    '//a[contains(.,"Información eco")]'
  );
  await btnInfoEconomica[0].click();

  // SELECCIÓN DEL CONTADOR
  // ==============================================================================
  console.log("INICIA LA SELECCIÓN DE CONTADOR(ES)");
  console.log(
    "================================================================"
  );
  // let Contador_es = [
  //   { tipo: "Contador", nombres: ["PABLO ESTEBAN MONTOYA MONTOYA (91124)"] },
  // ];

  await seleccionar_Profesional(Datos_Contadores, page, 2, Eventos);

  console.log(
    "================================================================"
  );
  console.log("FIN DE LA SELECCIÓN DE CONTADOR(ES)");

}

async function Informacion_financiera(page) {

  await page.select("#personClassificationId0", Datos_Empresa.TipoUsuario);
  //sE MANEJA DUALIDAD DSDE EL .ENV PARA CUANDO SON PERSONAS NATURALES O EMPRESAS
  // await page.select("#personClassificationId0", "PN");
  // await page.select("#personClassificationId0", "PJ");
  console.log(Datos_Economicos);

  await page.evaluate((Datos_Economicos) => {
    // console.log(Datos_Empresa);


    document.getElementById("activoCorrienteId0").value = Datos_Economicos.activoCorrienteId0;

    angular
      .element(document.getElementById("activoCorrienteId0"))
      .triggerHandler("change");

    document.getElementById("pasivoCorrienteId0").value = Datos_Economicos.pasivoCorrienteId0;

    angular
      .element(document.getElementById("pasivoCorrienteId0"))
      .triggerHandler("change");
    document.getElementById("activoTotalId0").value = Datos_Economicos.activoTotalId0;

    angular
      .element(document.getElementById("activoTotalId0"))
      .triggerHandler("change");

    document.getElementById("pasivoTotalId0").value = Datos_Economicos.pasivoTotalId0;

    angular
      .element(document.getElementById("pasivoTotalId0"))
      .triggerHandler("change");
  }, Datos_Economicos);

  const continPag4 = await page.$x('//span[contains(.,"Continuar")]');
  await continPag4[1].click();

}

async function Certificado_Shapefile(page, Empresa, IdArea) {
  // Subir Shapefile
  console.log(IdArea);

  try {
    let btncenti = await page.$x('//a[contains(.,"Certificac")]');
    await btncenti[0].click();

    await page.waitForSelector(`#p_CaaCataEnvMandatoryDocumentToAttachId0`);
    const RutadeShapefile = `./Documentos/${Empresa}/Sheips/${IdArea}.zip`;
    const ControladorDeCargaShapefile = await page.$(`#p_CaaCataEnvMandatoryDocumentToAttachId0`);
    await ControladorDeCargaShapefile.uploadFile(RutadeShapefile);


  } catch (error) {
    console.log("No se encontró el shapefile");
    let btncenti = await page.$x('//a[contains(.,"Certificac")]');
    await btncenti[0].click();

    await page.waitForSelector(`#p_CaaCataEnvMandatoryDocumentToAttachId0`);
    const RutadeShapefile = `./Documentos/${Empresa}/Sheips/Sector_${Empresa}.zip`;
    const ControladorDeCargaShapefile = await page.$(`#p_CaaCataEnvMandatoryDocumentToAttachId0`);
    await ControladorDeCargaShapefile.uploadFile(RutadeShapefile);

  }

  try {

    // Subir certificado
    let ArchivoAmbiental;
    ArchivoAmbiental = `./Documentos/${Empresa}/CertificadoAmbiental/${IdArea}.pdf`;


    await page.waitForSelector(`#p_CaaCataEnvMandatoryDocumentToAttachId1`);
    const RutaDelCertificado = ArchivoAmbiental;
    const ControladorCargaCertificado = await page.$(`#p_CaaCataEnvMandatoryDocumentToAttachId1`);
    await ControladorCargaCertificado.uploadFile(RutaDelCertificado);
  } catch (error) {
    console.log("No se encontró el certificado ambiental");
    let ArchivoAmbiental;
    ArchivoAmbiental = `./Documentos/${Empresa}/CertificadoAmbiental/Certificado_Ambiental.pdf`;


    await page.waitForSelector(`#p_CaaCataEnvMandatoryDocumentToAttachId1`);
    const RutaDelCertificado = ArchivoAmbiental;
    const ControladorCargaCertificado = await page.$(`#p_CaaCataEnvMandatoryDocumentToAttachId1`);
    await ControladorCargaCertificado.uploadFile(RutaDelCertificado);
  }


}


async function Documentos_Persona_Natural(page, Empresa) {

  try {


    // await page.waitForTimeout(300);
    await page.click("#acceptanceOfTermsId");
    // await page.waitForTimeout(300);

    const btnDocuSopor = await page.$x('//a[contains(.,"Documentac")]');
    await btnDocuSopor[0].click();
    console.log("si llego");
    await page.waitForTimeout(300);

    console.log("INICIA PROCESO DE ADJUNTAR DOCUMENTOS REGLAMENTARIOS");
    console.log(
      "================================================================"
    );

    let Documentos = [
      "1. Aceptacion Del Profesional Para Refrendar Documentos Tecnicos.pdf",//1
      "2. Fotocopia Tarjeta Profesional.pdf",//2
      "4. Declaracion De Renta Proponente 1 Anio 1.pdf",//3
      "5. Declaracion De Renta Proponente 1 Anio 2.pdf",//4
      "6. Estados Financieros Propios Certificados Y O Dictaminados Proponente 1 Anio 1.pdf",//5
      "7. Estados Financieros Propios Certificados Y O Dictaminados Proponente 1 Anio 2.pdf",//6
      "8. Extractos Bancarios Proponente 1.pdf",//7
      "9. RUT.pdf",//8
      "10. Fotocopia Documento De Identificacion.pdf",//9
      "13. Certificado Vigente De Antecedentes Disciplinarios.pdf",//10
      "14. Fotocopia Tarjeta Profesional Del Contador Revisor Fiscal.pdf",//11

    ];

    let ElementosFile = [
      "p_CaaCataMandatoryDocumentToAttachId0",//1
      "p_CaaCataMandatoryDocumentToAttachId1",//2
      "p_CaaCataMandatoryDocumentToAttachId3",//3
      "p_CaaCataMandatoryDocumentToAttachId4",//4
      "p_CaaCataMandatoryDocumentToAttachId5",//5
      "p_CaaCataMandatoryDocumentToAttachId6",//6
      "p_CaaCataMandatoryDocumentToAttachId7",//7
      "p_CaaCataMandatoryDocumentToAttachId8",//8
      "p_CaaCataMandatoryDocumentToAttachId9",//9
      "p_CaaCataMandatoryDocumentToAttachId10",//10
      "p_CaaCataMandatoryDocumentToAttachId11",//11
      //  "p_CaaCataMandatoryDocumentToAttachId12",//12
    ];
    console.log(ElementosFile.length);
    try {
      for (let i = 0; i < ElementosFile.length; i++) {
        try {
          await page.waitForSelector(`#${ElementosFile[i]}`);
          const RutaDelArchivo = `./Documentos/${Empresa}/DocumentosReglamentarios/${Documentos[i]}`;
          const ElementoControladorDeCarga = await page.$(
            `#${ElementosFile[i]}`
          );
          await ElementoControladorDeCarga.uploadFile(RutaDelArchivo);

          // Verificar si el archivo se cargó correctamente
          console.log(`Archivo ${Documentos[i]} adjuntado correctamente.`);
        } catch (error) {
          console.log(`Error al cargar el archivo ${Documentos[i]}:`, error);

          // Detener el bucle o manejar el error como sea necesario
          throw new Error(`Error al cargar el archivo ${Documentos[i]}`);
        }
      }
      console.log("sadas");
    } catch (error) {
      console.error("Error general al adjuntar archivos:", error);
    }

    console.log(
      "================================================================"
    );
    console.log("FINALIZA PROCESO DE ADJUNTAR DOCUMENTOS REGLAMENTARIOS");


  } catch (error) {
    console.log("BOTO ERROR");
  }

}


async function Documentos_Persona_juridica(page, Empresa) {

  try {


    // await page.waitForTimeout(300);
    await page.click("#acceptanceOfTermsId");
    // await page.waitForTimeout(300);

    const btnDocuSopor = await page.$x('//a[contains(.,"Documentac")]');
    await btnDocuSopor[0].click();
    console.log("si llego");
    await page.waitForTimeout(300);

    console.log("INICIA PROCESO DE ADJUNTAR DOCUMENTOS REGLAMENTARIOS");
    console.log(
      "================================================================"
    );

    let Documentos = [
      "1. Aceptacion Del Profesional Para Refrendar Documentos Tecnicos.pdf", //1
      "2. Fotocopia Tarjeta Profesional.pdf", //2
      "4. Declaracion De Renta Proponente 1 Anio 1.pdf", //3
      "5. Declaracion De Renta Proponente 1 Anio 2.pdf", //4
      "6. Estados Financieros Propios Certificados Y O Dictaminados Proponente 1 Anio 1.pdf", //5
      "7. Estados Financieros Propios Certificados Y O Dictaminados Proponente 1 Anio 2.pdf", //6
      "8. Extractos Bancarios Proponente 1.pdf", //7
      "9. RUT.pdf", //8
      "10. Fotocopia Documento De Identificacion.pdf", //9
      "11. Certificado De Composicion Accionaria De La Sociedad.pdf", //10
      "12. Certificado De Existencia Y Representacion Legal.pdf", //11
      "13. Certificado Vigente De Antecedentes Disciplinarios.pdf", //12
      "14. Fotocopia Tarjeta Profesional Del Contador Revisor Fiscal.pdf", //13
    ];

    let ElementosFile = [
      "p_CaaCataMandatoryDocumentToAttachId0", //1
      "p_CaaCataMandatoryDocumentToAttachId1", //2
      "p_CaaCataMandatoryDocumentToAttachId3", //3
      "p_CaaCataMandatoryDocumentToAttachId4", //4
      "p_CaaCataMandatoryDocumentToAttachId5", //5
      "p_CaaCataMandatoryDocumentToAttachId6", //6
      "p_CaaCataMandatoryDocumentToAttachId7", //7
      "p_CaaCataMandatoryDocumentToAttachId8", //8
      "p_CaaCataMandatoryDocumentToAttachId9", //9
      "p_CaaCataMandatoryDocumentToAttachId10", //10
      "p_CaaCataMandatoryDocumentToAttachId11", //11
      "p_CaaCataMandatoryDocumentToAttachId12", //12
      "p_CaaCataMandatoryDocumentToAttachId13", //13
      // "p_CaaCataMandatoryDocumentToAttachId14"//14
    ];
    console.log(ElementosFile.length);
    try {
      for (let i = 0; i < ElementosFile.length; i++) {
        try {
          await page.waitForSelector(`#${ElementosFile[i]}`);
          const RutaDelArchivo = `./Documentos/${Empresa}/DocumentosReglamentarios/${Documentos[i]}`;
          const ElementoControladorDeCarga = await page.$(
            `#${ElementosFile[i]}`
          );
          await ElementoControladorDeCarga.uploadFile(RutaDelArchivo);

          // Verificar si el archivo se cargó correctamente
          console.log(`Archivo ${Documentos[i]} adjuntado correctamente.`);
        } catch (error) {
          console.log(`Error al cargar el archivo ${Documentos[i]}:`, error);

          // Detener el bucle o manejar el error como sea necesario
          throw new Error(`Error al cargar el archivo ${Documentos[i]}`);
        }
      }
      console.log("sadas");
    } catch (error) {
      console.error("Error general al adjuntar archivos:", error);
    }

    console.log(
      "================================================================"
    );
    console.log("FINALIZA PROCESO DE ADJUNTAR DOCUMENTOS REGLAMENTARIOS");


  } catch (error) {
    console.log("BOTO ERROR");
  }
}

async function RECAPTCHA(page) {

  try {
    // Buscar el h2 que contenga la palabra RECAPTCHA usando XPath
    const [tituloHandle] = await page.$x("//h2[contains(text(), 'RECAPTCHA')]");
    if (!tituloHandle) {
      throw new Error('No se encontró el título con texto RECAPTCHA');
    }

    console.log('✅ Título RECAPTCHA encontrado');

    // Hacer click en el título
    await tituloHandle.click();
    console.log('✅ Hice click en el título');

    // Esperar un momento para que el foco se mueva
    // // // await page.waitForTimeout(500);

    //aca comienza

    console.log('✅ Título RECAPTCHA encontrado');

    // Hacer click en el título
    await tituloHandle.click();
    console.log('✅ Hice click en el título');

    // Esperar un momento para que el foco se mueva
    await page.waitForTimeout(500);
    await page.waitForTimeout(500);
    await page.waitForTimeout(500);
    //aca termina 
    //ACA COMIENZA
    console.log('✅ Título RECAPTCHA encontrado');

    // Hacer click en el título
    await tituloHandle.click();
    console.log('✅ Hice click en el título');


    //ACATERMINA
    await page.waitForTimeout(500);
    await page.waitForTimeout(500);
    await page.waitForTimeout(500);

    // Simular presionar Tab
    await page.keyboard.press('Tab');
    console.log('✅ Presioné TAB para mover el foco');

    // Esperar un poco
    await page.waitForTimeout(100);

    // // Simular presionar Enter
    await page.keyboard.press('Enter');
    console.log('✅ Presioné ENTER para activar el reCAPTCHA');
    return 1; // Salir del bucle si todo fue exitoso
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.waitForTimeout(500); // Esperar antes de reintentar
    return 0;
  }
}

async function verificarCaptchaResuelto(page, imagendeCaptcha) {
  console.log("Chequeando si el captcha está resuelto...");
  try {
    // Verificar si el captcha está resuelto
    const isCaptchaResolved = await page.evaluate(() => {
      const responseField = document.querySelector("#g-recaptcha-response");
      return responseField && responseField.value.length > 0;
    });

    // // Verificar si aparece el texto "Continuar"
    // const posibleContinuar = await page.$x('//span[contains(.,"Continuar")]');
    // if (posibleContinuar.length > 0) {
    //   console.log("⚠️ Se encontró el botón 'Continuar' en la página.");
    //   console.log([posibleContinuar]);
    //   await posibleContinuar[1].click();
    //   await page.waitForNavigation({
    //     waitUntil: "networkidle0",
    //   });
    //   await RECAPTCHA(page);
    // }

    // Verificar si aparece el iframe de imágenes (reto del captcha)
    // const captchaIframe = await page.$('iframe[src*="bframe"]');
    // if (captchaIframe) {
    //   console.log("🖼️ El reCAPTCHA está mostrando imágenes (desafío activo).");
    //   return 2; // El captcha no está resuelto si hay un iframe de imágenes
    // }
    if (imagendeCaptcha == 0) {
      const captchaIframeHandle = await page.$('iframe[src*="bframe"]');
      if (captchaIframeHandle) {
        console.log("🖼️ El reCAPTCHA está mostrando un desafío de imágenes.");


        // Esperar a que el contenido del iframe esté listo
        const captchaFrame = await captchaIframeHandle.contentFrame();
        if (!captchaFrame) {
          console.log("⚠️ El contenido del iframe aún no está listo. Reintentando...");
        } else {
          // Intentar detectar imágenes
          const imageTiles = await captchaFrame.$$('img');
          console.log(`Se encontraron ${imageTiles.length} imágenes en el desafío.`);
        }

        return 2; // El captcha no está resuelto si hay un iframe de imágenes

      }
    }


    if (isCaptchaResolved) {
      console.log("✅ El captcha ha sido resuelto.");

      return 1;
    } else {
      console.log("❌ El captcha no ha sido resuelto aún.");
      return 0;
    }
  } catch (error) {
    console.error("❌ Error al verificar el estado del captcha:", error);
    return 0;
  }

}


function Mineria(browser, Pin,) {
  (async () => {
    console.log("Esta es la vuelta " + ContadorVueltas);
    const page = await browser.newPage();

    let Primerpaso = setTimeout(() => {
      console.log("ENTRO EN EL PRIMERPASO");

      page.close();
      Mineria(browser, Pin);
    }, 20000);

    await Login(page);

    clearTimeout(Primerpaso);

    let Segundopaso = setTimeout(() => {
      console.log("ENTRO EN EL Segundopaso");
      page.close();
      Mineria(browser, Pin);
    }, 25000);

    await RadicarPropuesta(page);

    if (Agente == 1) {
      await Agente_Selecion_Empresa(page);
    }

    const { closestDateOption, input } = await seleccionar_Pin(page, Pin, 0);

    // await Minerales(page);

    clearTimeout(Segundopaso);



    // var IdArea = "";
    ContadorVueltas++;
    // var Celda = 0;

    const selectArea = await page.$('select[name="areaOfConcessionSlct"]');
    await selectArea.type("Otro tipo de terreno");

    const continDetallesdelArea = await page.$x('//a[contains(.,"área")]');
    await continDetallesdelArea[4].click();

    const selectporCeldas = await page.$(
      'select[id="selectedCellInputMethodSlctId"]'
    );
    await selectporCeldas.type(
      "Usando el mapa de selección para dibujar un polígono o ingresar celdas"
    );



    while (true) {



      const Pestanas = await browser.pages();
      console.log(`HAY ${Pestanas.length} PESTAÑAS ABIERTAS`);
      if (Pestanas.length >= 4) {
        EnviarCorreosParaPestanas++;
        if (EnviarCorreosParaPestanas <= 2) {
          // Se realiza envío de correo para alertar
          Correo(5, "", "");
        }
      }
      VerificarVencimientoPin(closestDateOption, input);
      console.log("Inicia el timer");
      let TimeArea = setTimeout(() => {
        console.log("ENTRO EN EL TimeArea");
        page.close();
        Mineria(browser, Pin);
      }, 25000);

      console.log("Bandera: " + Band);
      console.log("NombreArea: " + Areas[Band].NombreArea);
      console.log("Referencia: " + Areas[Band].Referencia);


      DetallesCompletos = await MonitorearAreas(page, Areas[Band].NombreArea, Areas[Band].Referencia, Areas[Band].Celdas);





      // console.log("Celdas: " + Areas[Band].Celdas);
      ComparacionCeldas = DetallesCompletos.AreaCeldas;
      const continCeldas = await page.$x('//span[contains(.,"Continuar")]');
      await page.waitForTimeout(1000);
      await continCeldas[1].click();

      try {
        await page.waitForFunction(() => {
          return Array.from(document.querySelectorAll("span"))
            .some(el => el.textContent.trim() === "Vea los errores a continuación (dentro de las pestañas):" ||
              el.textContent.trim() === "CELL_REOPENING_DATE");
        }, { timeout: 2000 });

        console.log("Se encontraron errores o reapertura");






        const spans = await page.$$eval("span", (els) => els.map(el => el.textContent.trim()));
        const mensajes = await page.$$eval('.errorMsg a', enlaces =>
          enlaces.map(el => el.textContent.trim())
        );
        if (spans.includes("Vea los errores a continuación (dentro de las pestañas):")) {
          console.log("Hay errores");
          page.evaluate(() => {
            document.querySelector('[id="cellIdsTxtId"]').value = "";
          });
        }
        if (mensajes.some(msg => msg.includes('CELL_REOPENING_DATE'))) {
          console.log('Mensaje que contiene CELL_REOPENING_DATE encontrado');
          if (contreapertura < 2) {
            Correo(3, Areas[Band].NombreArea, Areas[Band].Referencia);
          }
          contreapertura++;
          await page.evaluate(() => {
            document.querySelector('#cellIdsTxtId').value = '';
          });
        } else {
          /* CODIGO PARA REORGANIZAR AREA CON CELDAS NO DISPONIBLES, INFERIOR A LA INICIAL */
          try {

            // Extraer celdas no disponibles del DOM
            const celdasNoDisponibles = await page.$$eval('a.errorMsg', links => {
              return links
                .filter(link => link.textContent.includes('Las siguientes celdas de selección no están disponibles:'))
                .map(link => link.textContent.split(': ')[1].split(',').map(celda => celda.trim())); // Extrae las celdas y las limpia
            });

            console.log(`===============================================================================================`.cyan.bold);
            // console.log(`AREA COMPLETA => ${Area}`);
            // console.log(`CELDAS NO DISPONIBLES => ${celdasNoDisponibles}`);

            console.log(`ÁREA COMPLETA => `.magenta.bold);
            console.log(`[${Areas[Band].Celdas}]`);
            console.log(`CELDAS NO DISPONIBLES => `.red.bold);
            console.log(`[${celdasNoDisponibles}]`);



            if (Band != 81) {


              // Tipo, Area, Celda
              // Crear una lista de celdas no disponibles (eliminando espacios innecesarios)
              const celdasNoDisponiblesLimpias = celdasNoDisponibles[0].map(celda => celda.trim());

              // Asegurarse de que 'ComparacionCeldas' esté correctamente dividido en celdas
              const areaCeldas = ComparacionCeldas;

              // Filtrar el arreglo 'areaCeldas' para excluir las celdas no disponibles
              areaFiltrado = areaCeldas.filter(celda => !celdasNoDisponiblesLimpias.includes(celda));
              console.log('area filtrado ' + areaFiltrado);


              //console.log(`CELDAS DISPONIBLES => `. areaFiltrado);


              if (areaFiltrado.length > 0) {
                //Correo(1, Area, areaFiltrado);

                // Mostrar el nuevo arreglo que no contiene las celdas no disponibles
                // console.log('ÁREA MONTADA EXCLUYENDO LAS CELDAS QUE NO ESTÁN DISPONIBLES => ', areaFiltrado);
                // console.log(`ÁREA MONTADA EXCLUYENDO LAS CELDAS QUE NO ESTÁN DISPONIBLES => `.green.bold);
                console.log(`CELDAS DISPONIBLES => `.green.bold);
                console.log(`["${areaFiltrado.join(', ')}"],`);
                console.log(`===============================================================================================`.cyan.bold);
                //Band = 80;
                let datos = areaFiltrado.join(', ');
                let Filtrodelfriltro = [datos];
                await MonitorearAreas(page, Areas[Band].NombreArea, Areas[Band].Referencia, Filtrodelfriltro);
                // await page.waitForTimeout(1000);
                await continCeldas[1].click();
                await page.waitForFunction(
                  url => window.location.href === url,
                  { timeout: 6000 },
                  "https://annamineria.anm.gov.co/sigm/index.html#/p_CaaIataInputTechnicalEconomicalDetails"
                );
                //se tiene que cambiar para decir que fue por reorganizacion
                Correo(1, Areas[Band].NombreArea, Areas[Band].Referencia);
                clearTimeout(TimeArea);
                break;

              } else {

                console.log('No se encontraron celdas no disponibles.');
                console.log(`===============================================================================================`.cyan.bold);
              }


            }
            /* FIN FIN FIN */
          } catch (error) {
            console.log('Error al reorganizar las celdas del área:', error);

          }
        }


        console.log("Limpio El campo del area");
        page.evaluate(() => {
          document.querySelector('[id="cellIdsTxtId"]').value = "";
        });
        Band++;
        if (Areas.length == Band) {
          Band = 0;
        }

      } catch (error) {
        console.log("No se encontraron errores en la página");
        await page.waitForFunction(
          url => window.location.href === url,
          { timeout: 6000 },
          "https://annamineria.anm.gov.co/sigm/index.html#/p_CaaIataInputTechnicalEconomicalDetails"
        );

        console.log("✅ La URL esperada ya está activa");
        Correo(1, Areas[Band].NombreArea, Areas[Band].Referencia);
        clearTimeout(TimeArea);
        break;
      }

      // await page.waitForTimeout(1000000);



      console.log("limpia el timer");
      clearTimeout(TimeArea);

    }


    let TimeNOpaso = setTimeout(() => {
      bandera = 99;
      console.log("ENTRO EN EL TimeNOpaso");
      page.close();
      Mineria(browser, Pin);
    }, 20000);


    // while (bandera != 99) {
    //   await page.waitForTimeout(500);
    //   console.log(page.url());
    //   if (
    //     page.url() ==
    //     "https://annamineria.anm.gov.co/sigm/index.html#/p_CaaIataInputTechnicalEconomicalDetails"
    //   ) {
    //     bandera = 99;

    //     console.log("Si cargo la pagina  ");
    //     clearTimeout(TimeNOpaso);
    //   } else {
    //     console.log("Nada no la carga ");
    //   }
    // }


    clearTimeout(TimeNOpaso);
    let RadiPrimero = setTimeout(() => {
      console.log("ENTRO EN EL RadiPrimero");
      page.close();
      Mineria(browser, Pin);
    }, 30000);

    try {
      await Detalles_de_area(page);
    } catch (error) {
      await Detalles_de_area(page);
    }

    
    Pasolotecnico = await Informacion_tecnica(page);
    if (Pasolotecnico) {
    } else {
      await Informacion_tecnica(page);
    }

    try {
      await Profesionales(page, 0);
    } catch (error) {
      await Profesionales(page, 0);
    }

    try {
      await Informacion_financiera(page);
    } catch (error) {
      await Informacion_financiera(page);
    }

    try {
      await page.waitForFunction(
        url => window.location.href === url,
        { timeout: 4000 },
        "https://annamineria.anm.gov.co/sigm/index.html#/p_CaaIataAttachDocuments"
      );

      console.log("✅ La URL esperada ya está activa");

    } catch (error) {
      console.log("Error al esperar la URL esperada:");

      try {
        await page.waitForFunction(() => {
          return Array.from(document.querySelectorAll("span"))
            .some(el => el.textContent.trim() === "Vea los errores a continuación (dentro de las pestañas):");
        }, { timeout: 2000 });

        console.log("Se encontraron errores en la página");
        const btnInfoTecnica = await page.$x('//a[contains(.,"Información t")]');
        await btnInfoTecnica[0].click();
        await Profesionales(page, 1);
        await Informacion_financiera(page);
        try {
          await page.waitForFunction(
            url => window.location.href === url,
            { timeout: 2000 },
            "https://annamineria.anm.gov.co/sigm/index.html#/p_CaaIataAttachDocuments"
          );
          console.log("✅ La URL esperada ya está activa");
        } catch (error) {
          console.log("Error al esperar la URL esperada:");
        }
      } catch (error) {
        console.log("Error al esperar los errores en la página:");
      }
    }

    console.log("Vamos a adjuntar los documentos");




    clearTimeout(RadiPrimero);
    let Radisegundo = setTimeout(() => {
      console.log("ENTRO EN EL Radisegundo");
      //page.close();
      Mineria(browser, Pin);
    }, 10000);


    await Certificado_Shapefile(page, Empresa, Areas[Band].NombreArea);




    if (Datos_Empresa.TipoUsuario === 'PJ') {
      await Documentos_Persona_juridica(page, Empresa);

    } else {
      await Documentos_Persona_Natural(page, Empresa);

    }


    const continPag = await page.$x('//span[contains(.,"Continuar")]');
    await continPag[1].click();

    clearTimeout(Radisegundo);
    await page.waitForNavigation({
      waitUntil: "networkidle0",
    });
    console.log(" si navego ");




    let RadiTercero = setTimeout(() => {
      console.log("ENTRO EN EL Radisegundo");
      //page.close();
      Mineria(browser, Pin);
    }, 120000);

    //  await page.waitForTimeout(1000000);


    while (true) {

      let resultado = await RECAPTCHA(page);
      if (resultado == 1) {
        break;
      }

    }

    var imagendeCaptcha = 0;
    while (true) {
      await page.waitForTimeout(1500);

      if (page.url() === 'https://annamineria.anm.gov.co/sigm/index.html#/p_CaaIataSummary') {
        let resultado = await verificarCaptchaResuelto(page, imagendeCaptcha);
        if (resultado === 1) {
          clearTimeout(RadiTercero);
          break;
        } else if (resultado === 2) {
          console.log("El captcha sigue en modo reto de imagenes");
          Correo(6, Areas[Band].NombreArea, Areas[Band].Referencia);
          // lO RETIRO PORQUE NO VALE LA PENA
          // Mineria(browser, Pin);
          imagendeCaptcha = 1;
        } else {
          // await RECAPTCHA(page);
        }

      } else if (page.url() === 'https://annamineria.anm.gov.co/sigm/index.html#/p_CaaIataAttachDocuments') {
        const posibleContinuar = await page.$x('//span[contains(.,"Continuar")]');
        if (posibleContinuar.length > 0) {
          console.log("⚠️ Se encontró el botón 'Continuar' en la página.");
          console.log([posibleContinuar]);
          await posibleContinuar[1].click();
          await page.waitForNavigation({
            waitUntil: "networkidle0",
          });
          await RECAPTCHA(page);
        }
      }
    }

    // await page.waitForTimeout(1000000);

    console.log("51. Bóton Radicar");

    const btnRadicar1 = await page.$x('//span[contains(.,"Radicar")]');
    console.log("Este es el boton radicar : " + btnRadicar1);

    console.log("Le di click");

    try {
      await btnRadicar1[1].click();
    } catch (exepcion) {
      console.log("La 1 tampoco Y_Y");
    }


    //CORREO RADICACION
    Correo(2, Areas[Band].NombreArea, Areas[Band].Referencia);
    await page.waitForTimeout(180000);
    Mineria(browser, Pin);
  })();
}

// FUNCIÓN PARA ENVÍO DE CORREO SEGÚN LA SITUACIÓN
function Correo(Tipo, Area, Celda) {
  // 1. Liberada 2. radicada 3. Fecha reapertura
  let msg = ""; 
  let Color = "";
  let Texto = "";
  //Area = "Tranquilos area de prueba";
  if (Tipo == 1) {
    msg =
      `¡¡¡Posible Area Liberada!!! ${EquipoActual} ${Area} ${Empresa}`;
    Color = "#0eff16ff";
    Texto = "POSIBLE AREA LIBERADA";
  } else if (Tipo == 2) {
    msg =
      `Area Radicada  ${EquipoActual} ${Area} ${Empresa}`;
    Color = "#D4AF37";
    Texto = "POSIBLE AREA RADICADA";
  } else if (Tipo == 3) {
    msg =
      `¡¡¡Area Con fecha de Reapertura!!! ${EquipoActual} ${Area} ${Empresa}`;
    Color = "#427345ff";
    Texto = "AREA CON REAPERTURA";
  } else if (Tipo == 4) {
    msg = Area + " " + Empresa + " ¡¡¡Verificar!!!!.";
  } else if (Tipo == 5) {
    msg = "¡¡¡Ojo Pestañas!!! " + EquipoActual;
    Color = "#fe1426";
    Texto = "Pestañas";
  } else if (Tipo == 6) {
    msg =
      `Rapido aparecio un recaptcha   ${EquipoActual}`;
    Color = "rgba(180, 33, 170, 1)";
    Texto = "RECAPTCHA RECAPTCHA RECAPTCHA";
  }else if (Tipo == 7) {
    msg = "LOGIN";
    Color = "#fe1426";
    Texto = "😡😡AVISO llevo 1:00 minutos en login😡😡😡😡😡😡";
  }



  let transporter = nodemailer.createTransport({
    host: "mail.ceere.net", // hostname
    secureConnection: false,
    port: 465,
    tls: {
      ciphers: "SSLv3",
    },
    auth: {
      user: "correomineria2@ceere.net",
      pass: "1998Ceere*",
    },
  });

  let mailOptions = {
    from: msg + '"Ceere" <correomineria2@ceere.net>', //Deje eso quieto Outlook porne demasiados problemas
    to: "jorgecalle@hotmail.com, jorgecaller@gmail.com, alexisaza@hotmail.com,  ceereweb@gmail.com, Soporte2ceere@gmail.com, soportee4@gmail.com, soporte.ceere06068@gmail.com",
    //to: '  Soporte2ceere@gmail.com',
    subject: "LA AREA ES-> " + Area,
    text: "LA AREA ES->  " + Area + "  " + Celda,
    html: `
            <html>
                <head>
                    <style>
                        .container {
                            font-family: Arial, sans-serif;
                            max-width: 600px;
                            margin: auto;
                            padding: 20px;
                            border: 1px solid #ddd;
                            border-radius: 5px;
                            background-color: #f9f9f9;
                        }
                        .header {
                            background-color: ${Color};
                            color: white;
                            padding: 10px;
                            text-align: center;
                            border-radius: 5px 5px 0 0;
                        }
                        .content {
                            margin: 20px 0;
                        }
                        .footer {
                            text-align: center;
                            padding: 10px;
                            font-size: 12px;
                            color: #777;
                            border-top: 1px solid #ddd;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h3> ${Texto} </h3>
                        </div>
                        <div class="content">
                            <p><strong>Detalles:</strong></p>
                            <ul>
                                <li><strong>Empresa: </strong><br>${Empresa}</li>
                                <li><strong>Area:</strong><br>${Area}</li>
                                <li><strong>Celda:</strong><br>${Celda}</li>
                            <li><strong>Equipo Actual:</strong><br>${EquipoActual}</li>
                            </ul>
                        </div>
                        <div class="footer">
                            <p>Creado por Ceere Software - © 2024 Todos los derechos reservados</p>
                        </div>
                    </div>
                </body>
            </html>
        `,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return console.log(error);
    }

    console.log("Message sent: " + info.response);
  });
}



async function seleccionar_Profesional(profesionales, page, Tipo, Eventos) {
  if (Eventos == 1) {
    DeleteProfesional = await page.$x('//span[contains(.,"Eliminar")]');
    if (Tipo == 1) {
      await DeleteProfesional[0].click();
    } else {
      try {
        await DeleteProfesional[0].click();
      } catch (error) {
        console.log("ERR 0");
      }
      try {
        await DeleteProfesional[1].click();
      } catch (error) {
        console.log("ERR 1");
      }
      try {
        await DeleteProfesional[2].click();
      } catch (error) {
        console.log("ERR 2");
      }
      try {
        await DeleteProfesional[3].click();
      } catch (error) {
        console.log("ERR 3");
      }
      try {
        await DeleteProfesional[4].click();
      } catch (error) {
        console.log("ERR 4");
      }
    }
  }
  for (const profesional of profesionales) {
    const tipoProfesional = profesional.tipo;
    const nombres = profesional.nombres;

    // Seleccionar el tipo de profesional en el primer select
    let selectorTipoProfesion =
      Tipo == 1
        ? 'select[id="techProfessionalDesignationId"]'
        : 'select[id="ecoProfessionalDesignationId"]';

    await page.waitForSelector(selectorTipoProfesion, { visible: true });
    await page.select(
      selectorTipoProfesion,
      await page.evaluate((selector, tipo) => {
        const select = document.querySelector(selector);
        const option = [...select.options].find(opt =>
          opt.textContent.includes(tipo)
        );
        return option ? option.value : "";
      }, selectorTipoProfesion, tipoProfesional)
    );

    // Iterar sobre los nombres y seleccionar cada uno en el segundo select
    for (const nombre of nombres) {
      console.log(`Tipo Profesional: ${tipoProfesional} - Nombre: (${nombre})`);

      let selectorProfesional =
        Tipo == 1
          ? 'select[id="techApplicantNameId"]'
          : 'select[id="ecoApplicantNameId"]';

      await page.waitForSelector(selectorProfesional, { visible: true });

      // Esperar que la opción con ese nombre aparezca
      await page.waitForFunction(
        (selector, nombre) => {
          const select = document.querySelector(selector);
          if (!select) return false;
          return [...select.options].some(opt =>
            opt.textContent.includes(nombre)
          );
        },
        {},
        selectorProfesional,
        nombre
      );

      // Seleccionar el valor de esa opción
      await page.select(
        selectorProfesional,
        await page.evaluate((selector, nombre) => {
          const select = document.querySelector(selector);
          const option = [...select.options].find(opt =>
            opt.textContent.includes(nombre)
          );
          return option ? option.value : "";
        }, selectorProfesional, nombre)
      );

      await page.waitForTimeout(300);


      addProfesional = await page.$x('//span[contains(.,"Agregar")]');
      if (Tipo == 1) {
        await addProfesional[0].click();
      } else {
        try {
          await addProfesional[0].click();
        } catch (error) {
          console.log("ERR 0");
          console.log(`Bro manito sabe que  pilke -> ${error}`);
        }
        try {
          await addProfesional[1].click();
        } catch (error) {
          console.log("ERR 1");
          console.log(`Bro manito sabe que  pilke -> ${error}`);
        }
        try {
          await addProfesional[2].click();
        } catch (error) {
          console.log("ERR 2");
          console.log(`Bro manito sabe que  pilke -> ${error}`);
        }
        try {
          await addProfesional[3].click();
        } catch (error) {
          console.log("ERR 3");
          console.log(`Bro manito sabe que  pilke -> ${error}`);
        }
        try {
          await addProfesional[4].click();
        } catch (error) {
          console.log("ERR 4");
          console.log(`Bro manito sabe que  pilke -> ${error}`);
        }
      }
    }
  }
}



var CorreoEnviado = false;
var PrimerCorreoEnviado = false;
// FUNCIÓN PARA VERIFICAR VENCIMIENTO DE PIN Y ENVIAR RECORDATORIO
function VerificarVencimientoPin(
  selectedText,
  TextoDeOpcionSeleccionadaEnCampoPin
) {
  const input = TextoDeOpcionSeleccionadaEnCampoPin;

  // Separar la fecha después de la coma
  const dateString = input.split(",")[1].trim();

  // Crear un objeto de fecha a partir de la cadena
  const targetDate = new Date(dateString);

  // Obtener la fecha actual
  const currentDate = new Date();

  // Calcular la diferencia en milisegundos
  const diffInMs = targetDate - currentDate;

  // Convertir la diferencia en días
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

  const diaSemana = targetDate.toLocaleString("es-Es", { weekday: "long" });
  console.log(`¡¡¡ DIFERENCIA EN DÍAS PIN: ${diffInDays}`);
  const Description = `El pin vence en ${diffInDays} días, es decir, tiene vigencia hasta el día ${diaSemana} - ${dateString}`;

  // Se captura la hora del día actual
  const HoraActual = currentDate.getHours();

  // Se captura el minuto actual
  const MinutoActual = currentDate.getMinutes();

  // Se captura el segundo actual
  const SegundoActual = currentDate.getSeconds();

  // Se verifica si la diferencia de días es igual a 5 y si la hora actual contiene 7 de la mañana ó contiene 3 de la tarde. Para hacer 2 envíos de recordatorio el día que se cumplan todas las condiciones

  // Primer envío: 07:00 am
  if (
    diffInDays === 5 &&
    [7].includes(HoraActual) &&
    MinutoActual === 0 &&
    CorreoEnviado === false &&
    !PrimerCorreoEnviado
  ) {
    console.log(
      "TODAS LAS CONDICIONES SE CUMPLIERON, SE ENVIARÁ EL PRIMER CORREO RECORDANDO EL VENCIMIENTO DEL PIN SELECCIONADO..."
    );
    Correo(4, selectedText, Description);
    CorreoEnviado = true;
    PrimerCorreoEnviado = true;
  }

  // Resetear el flag solo una vez después del primer correo
  if (
    diffInDays === 5 &&
    HoraActual > 7 &&
    HoraActual < 15 &&
    MinutoActual === 0 &&
    PrimerCorreoEnviado &&
    CorreoEnviado
  ) {
    CorreoEnviado = false;
    console.log("LA VARIABLE DE CORREO ENVIADO SE HIZO FALSA");
  }

  // Segundo envío: 03:00 pm
  if (
    diffInDays === 5 &&
    [15].includes(HoraActual) &&
    MinutoActual === 0 &&
    CorreoEnviado === false
  ) {
    console.log(
      "TODAS LAS CONDICIONES SE CUMPLIERON, SE ENVIARÁ EL SEGUNDO CORREO RECORDANDO EL VENCIMIENTO DEL PIN SELECCIONADO..."
    );
    Correo(4, selectedText, Description);
    CorreoEnviado = true;
    PrimerCorreoEnviado = false;
  }
}

const Areas =
  [
    // // // /*{
    // // //   NombreArea: "prueba", // nombre del area
    // // //   Referencia: "18N05N14M12R", // celda referencia
    // // //   Celdas: ["18N05N14M12R"] // area completa de celdas
    // // // },*/

    // // // /* {
    // // //   NombreArea: "prueba",
    // // //   Referencia: "18N05N14M12R",
    // // //   Celdas: ["18N05N14M12R"]
    // // // }*/ 


    {
      NombreArea: "507945",
      Referencia: "18P09K04M20C",
      Celdas: ["18P09K04M20C, 18P09K04M20N, 18P09K04N16K, 18P09K04N11R, 18P09K04N11L, 18P09K04N16N, 18P09K04N11Z, 18P09K04N17L, 18P09K04N17G, 18P09K04N17S, 18P09K04N17C, 18P09K04N12S, 18P09K04N12Z, 18P09K04M20S, 18P09K04M15Y, 18P09K04M20P, 18P09K04N11V, 18P09K04N16R, 18P09K04N16G, 18P09K04N16S, 18P09K04N11X, 18P09K04N12V, 18P09K04N12X, 18P09K04N17D, 18P09K04N12Y, 18P09K04N17J, 18P09K04N12U, 18P09K04N12P, 18P09K04N18Q, 18P09K04N13V, 18P09K04N18G, 18P09K04M20U, 18P09K04M15U, 18P09K04N16A, 18P09K04N11K, 18P09K04N16C, 18P09K04N16D, 18P09K04N11Y, 18P09K04N17F, 18P09K04N12K, 18P09K04N17H, 18P09K04N17N, 18P09K04N12T, 18P09K04M20D, 18P09K04M20J, 18P09K04N16L, 18P09K04N11W, 18P09K04N16H, 18P09K04N11S, 18P09K04N16J, 18P09K04N16E, 18P09K04N17R, 18P09K04N12W, 18P09K04N12L, 18P09K04N17M, 18P09K04N17T, 18P09K04N13Q, 18P09K04N13K, 18P09K04N18B, 18P09K04N13W, 18P09K04N13S, 18P09K04N13M, 18P09K04M20X, 18P09K04M20M, 18P09K04M20T, 18P09K04M20I, 18P09K04M20Z, 18P09K04N16Q, 18P09K04N16X, 18P09K04N16Z, 18P09K04N17A, 18P09K04N17W, 18P09K04N18A, 18P09K04N18W, 18P09K04M20Y, 18P09K04M15T, 18P09K04M15N, 18P09K04M15Z, 18P09K04N11Q, 18P09K04N16B, 18P09K04N16I, 18P09K04N11M, 18P09K04N11N, 18P09K04N12R, 18P09K04N17U, 18P09K04N18V, 18P09K04N18L, 18P09K04N13L, 18P09K04M15P, 18P09K04N16W, 18P09K04N16Y, 18P09K04N16M, 18P09K04N16U, 18P09K04N12Q, 18P09K04N17X, 18P09K04N17Y, 18P09K04N12N, 18P09K04N18K, 18P09K04N18F, 18P09K04M20H, 18P09K04M20E, 18P09K04N16V, 18P09K04N16F, 18P09K04N16T, 18P09K04N11T, 18P09K04N16P, 18P09K04N11U, 18P09K04N11P, 18P09K04N17V, 18P09K04N17Q, 18P09K04N17K, 18P09K04N17B, 18P09K04N12M, 18P09K04N17I, 18P09K04N17Z, 18P09K04N17P, 18P09K04N17E, 18P09K04N18R, 18P09K04N13R"]
    },
     {
      NombreArea: "508391",
      Referencia: "18P09K04N18H",
      Celdas: ["18P09K04N18H, 18P09K04N18Y, 18P09K04N18N, 18P09K04N19Z, 18P09K04N19P, 18P09K04N20H, 18P09K04N20I, 18P09K04N20U, 18P09K04P16V, 18P09K04P16W, 18P09K04P16S, 18P09K04P16H, 18P09K04P16D, 18P09K04P16J, 18P09K04P16E, 18P09K04P17V, 18P09K04P17W, 18P09K04P17S, 18P09K04P18F, 18P09K04P18U, 18P09K09C04Q, 18P09K04P19F, 18P09K09C14G, 18P09K09C09R, 18P09K04P19B, 18P09K09C04S, 18P09K04P19H, 18P09K04P19T, 18P09K09C04Z, 18P09K04P24U, 18P09K09C05K, 18P09K09C05F, 18P09K09C05A, 18P09K04P25F, 18P09K04P20A, 18P09K09C05S, 18P09K09C05G, 18P09K09C05B, 18P09K09C10Y, 18P09K09C10I, 18P09K04P20Y, 18P09K09C10E, 18P09K09C05E, 18P09K04P25P, 18P09K04P20U, 18P09K09D11A, 18P09K09D01K, 18P09K09D01X, 18P09K09D01M, 18P09K04Q21S, 18P09K04Q16M, 18P09K09D11D, 18P09K09D06I, 18P09K09D01D, 18P09K09D06Z, 18P09K09D01Z, 18P09K09D01E, 18P09K09D12F, 18P09K09D07F, 18P09K09D02F, 18P09K04Q17F, 18P09K09D07R, 18P09K04Q17W, 18P09K04Q17R, 18P09K04N18U, 18P09K04N19Q, 18P09K04N19K, 18P09K04N19B, 18P09K04N20Y, 18P09K04N20P, 18P09K04P16R, 18P09K04P16T, 18P09K04P16N, 18P09K04P17L, 18P09K04P17X, 18P09K04P18A, 18P09K09C09K, 18P09K09C04F, 18P09K04P24F, 18P09K09C04R, 18P09K04P24S, 18P09K04P19N, 18P09K09C09J, 18P09K09C04U, 18P09K04P20Q, 18P09K04P20F, 18P09K09C10W, 18P09K09C05R, 18P09K04P25H, 18P09K04P20X, 18P09K09C10D, 18P09K09C05N, 18P09K04P25Y, 18P09K04P25N, 18P09K09C10U, 18P09K09C05P, 18P09K04P20P, 18P09K04P20E, 18P09K09D06L, 18P09K09D01G, 18P09K04Q21L, 18P09K04Q21B, 18P09K04Q16R, 18P09K09D01S, 18P09K04Q21M, 18P09K04Q16C, 18P09K09D01N, 18P09K04Q21D, 18P09K09D06U, 18P09K04Q21P, 18P09K04Q16U, 18P09K09D07V, 18P09K09D07Q, 18P09K09D07A, 18P09K09D02Q, 18P09K04Q22V, 18P09K09D07W, 18P09K09D02L, 18P09K09D02G, 18P09K04Q22H, 18P09K04Q17H, 18P09K04N18I, 18P09K04N18D, 18P09K04N19A, 18P09K04N19I, 18P09K04N19U, 18P09K04N20A, 18P09K04N20X, 18P09K04N20D, 18P09K04P16F, 18P09K04P16U, 18P09K04P17G, 18P09K04P17B, 18P09K04P17H, 18P09K04P17N, 18P09K04P17J, 18P09K04P18L, 18P09K04P18M, 18P09K09C09V, 18P09K04P24K, 18P09K09C09L, 18P09K04P24W, 18P09K04P19R, 18P09K04P19L, 18P09K09C14C, 18P09K09C04M, 18P09K04P24X, 18P09K09C09D, 18P09K09C04Y, 18P09K09C04N, 18P09K04P24T, 18P09K04P24I, 18P09K09C09Z, 18P09K09C09E, 18P09K04P24E, 18P09K04P19J, 18P09K09C15A, 18P09K09C10F, 18P09K04P25V, 18P09K04P25A, 18P09K09C15H, 18P09K09C10X, 18P09K09C10G, 18P09K09C10B, 18P09K09C10C, 18P09K09C05C, 18P09K04P25W, 18P09K04P25M, 18P09K04P25G, 18P09K04P20B, 18P09K09C15D, 18P09K09C05I, 18P09K09C05D, 18P09K04P20I, 18P09K09D06V, 18P09K04Q16A, 18P09K09D01L, 18P09K04Q21W, 18P09K04Q21R, 18P09K04Q21C, 18P09K04Q16S, 18P09K04Q11Y, 18P09K09D01P, 18P09K04Q21J, 18P09K04Q21E, 18P09K04Q22F, 18P09K04Q22A, 18P09K09D07G, 18P09K04Q22B, 18P09K09D07X, 18P09K09D07C, 18P09K09D02M, 18P09K04Q17C, 18P09K04N18J, 18P09K04N19V, 18P09K04N19W, 18P09K04N19R, 18P09K04N19X, 18P09K04N20Q, 18P09K04N20M, 18P09K04P17F, 18P09K04P17Y, 18P09K04P17T, 18P09K04P17I, 18P09K04P17D, 18P09K04P17U, 18P09K04P17E, 18P09K04P18Q, 18P09K04P18W, 18P09K04P18R, 18P09K04P18K, 18P09K04P18D, 18P09K04P18P, 18P09K04P19Q, 18P09K09C09B, 18P09K04P19G, 18P09K09C09C, 18P09K09C04X, 18P09K04P24M, 18P09K04P24C, 18P09K04P19X, 18P09K09C14I, 18P09K09C09N, 18P09K04P24D, 18P09K04P19D, 18P09K09C14J, 18P09K04P24P, 18P09K04P19P, 18P09K09C10V, 18P09K09C10A, 18P09K09C15G, 18P09K09C10S, 18P09K09C05W, 18P09K09C05H, 18P09K04P25X, 18P09K04P20G, 18P09K09C10P, 18P09K04P25Z, 18P09K04P25U, 18P09K04P25E, 18P09K09D11F, 18P09K09D06Q, 18P09K04Q21K, 18P09K04Q21F, 18P09K04Q21A, 18P09K04Q16F, 18P09K04Q16W, 18P09K04Q16G, 18P09K09D01C, 18P09K09D06T, 18P09K09D01T, 18P09K04Q21T, 18P09K09D01J, 18P09K04Q21U, 18P09K04Q16Z, 18P09K09D07K, 18P09K09D02K, 18P09K04Q22Q, 18P09K09D07L, 18P09K09D07B, 18P09K09D02B, 18P09K04Q17G, 18P09K09D02S, 18P09K09D02C, 18P09K04Q22X, 18P09K04N18M, 18P09K04N18T, 18P09K04N18E, 18P09K04N19G, 18P09K04N19S, 18P09K04N19Y, 18P09K04N20R, 18P09K04N20G, 18P09K04N20Z, 18P09K04P16K, 18P09K04P16G, 18P09K04P16B, 18P09K04P16Z, 18P09K04P17Q, 18P09K04P17K, 18P09K04P17R, 18P09K04P17Z, 18P09K04P17P, 18P09K04P18V, 18P09K04P18G, 18P09K04P18B, 18P09K04P18T, 18P09K09C09W, 18P09K09C04W, 18P09K09C04L, 18P09K09C04B, 18P09K04P24R, 18P09K04P24L, 18P09K09C04H, 18P09K04P24H, 18P09K04P19S, 18P09K04P19C, 18P09K09C14D, 18P09K09C09T, 18P09K04P24Y, 18P09K04P24N, 18P09K09C09U, 18P09K09C04E, 18P09K09C15F, 18P09K09C10K, 18P09K04P25K, 18P09K04P20K, 18P09K09C10L, 18P09K09C05X, 18P09K09C05M, 18P09K04P25R, 18P09K04P25L, 18P09K04P25B, 18P09K04P20M, 18P09K09C15I, 18P09K09C10T, 18P09K09C05T, 18P09K04P25D, 18P09K04P20N, 18P09K04P20D, 18P09K09C15J, 18P09K09C05U, 18P09K04P25J, 18P09K04P20Z, 18P09K09D06A, 18P09K09D01Q, 18P09K09D01F, 18P09K04Q21Q, 18P09K04Q16Q, 18P09K09D11G, 18P09K09D06G, 18P09K09D06B, 18P09K09D01R, 18P09K09D06S, 18P09K04Q21X, 18P09K04Q16X, 18P09K04Q16H, 18P09K04Q21Y, 18P09K04Q16I, 18P09K04Q16D, 18P09K04Q21Z, 18P09K04Q11Z, 18P09K09D02V, 18P09K04Q17K, 18P09K04Q22G, 18P09K09D12H, 18P09K09D07H, 18P09K04Q22M, 18P09K04Q17X, 18P09K04N18X, 18P09K04N18S, 18P09K04N18C, 18P09K04N18P, 18P09K04N19L, 18P09K04N19C, 18P09K04N20V, 18P09K04N20W, 18P09K04N20B, 18P09K04N20C, 18P09K04N20T, 18P09K04P16Q, 18P09K04N20E, 18P09K04P16A, 18P09K04P17A, 18P09K04P18S, 18P09K04P18Y, 18P09K04P18N, 18P09K04P18I, 18P09K04P18Z, 18P09K09C04V, 18P09K04P24Q, 18P09K04P19A, 18P09K09C14B, 18P09K04P24B, 18P09K04P19W, 18P09K09C09X, 18P09K09C09I, 18P09K09C04D, 18P09K09C14E, 18P09K04P20V, 18P09K09C10R, 18P09K09C05L, 18P09K04P25S, 18P09K04P25T, 18P09K04P20T, 18P09K09C15E, 18P09K09C10Z, 18P09K09D01V, 18P09K04Q21V, 18P09K09D06R, 18P09K04Q21G, 18P09K09D11H, 18P09K09D11C, 18P09K09D06X, 18P09K09D06C, 18P09K04Q21H, 18P09K09D01Y, 18P09K09D01I, 18P09K04Q21N, 18P09K04Q21I, 18P09K04Q16T, 18P09K04Q16N, 18P09K09D06P, 18P09K09D12A, 18P09K09D02A, 18P09K04Q22K, 18P09K04Q12V, 18P09K09D12B, 18P09K09D02W, 18P09K09D02R, 18P09K04Q22R, 18P09K04Q17B, 18P09K09D02X, 18P09K04Q22S, 18P09K04Q22C, 18P09K04Q17M, 18P09K04N18Z, 18P09K04N19F, 18P09K04N19J, 18P09K04N19E, 18P09K04N20K, 18P09K04N20F, 18P09K04N20S, 18P09K04N20N, 18P09K04N20J, 18P09K04P16P, 18P09K04P17C, 18P09K04P18C, 18P09K09C09Q, 18P09K09C09A, 18P09K09C04A, 18P09K04P24V, 18P09K04P19V, 18P09K09C09G, 18P09K09C04G, 18P09K09C14H, 18P09K09C09H, 18P09K09C09Y, 18P09K04P19I, 18P09K09C09P, 18P09K04P24J, 18P09K04P19Z, 18P09K09C10Q, 18P09K04P25Q, 18P09K09C15B, 18P09K09C15C, 18P09K09C10H, 18P09K04P20W, 18P09K04P20R, 18P09K04P20S, 18P09K04P20H, 18P09K04P20C, 18P09K09C10N, 18P09K04P25I, 18P09K09C10J, 18P09K09C05J, 18P09K04P20J, 18P09K09D06F, 18P09K04Q16K, 18P09K09D06W, 18P09K09D01B, 18P09K04Q16B, 18P09K09D06M, 18P09K09D06H, 18P09K09D01H, 18P09K09D06N, 18P09K09D11J, 18P09K09D11E, 18P09K09D06J, 18P09K09D06E, 18P09K09D01U, 18P09K04Q16P, 18P09K04Q17V, 18P09K04Q22L, 18P09K04Q12W, 18P09K09D12C, 18P09K09D07S, 18P09K04Q12X, 18P09K04N19M, 18P09K04N19H, 18P09K04N19T, 18P09K04N19N, 18P09K04N19D, 18P09K04N20L, 18P09K04P16L, 18P09K04P16X, 18P09K04P16M, 18P09K04P16C, 18P09K04P16Y, 18P09K04P16I, 18P09K04P17M, 18P09K04P18X, 18P09K04P18H, 18P09K04P18J, 18P09K04P18E, 18P09K09C14F, 18P09K09C14A, 18P09K09C09F, 18P09K09C04K, 18P09K04P24A, 18P09K04P19K, 18P09K04P24G, 18P09K09C09S, 18P09K09C09M, 18P09K09C04C, 18P09K04P19M, 18P09K09C04T, 18P09K09C04I, 18P09K04P19Y, 18P09K09C04P, 18P09K09C04J, 18P09K04P24Z, 18P09K04P19U, 18P09K04P19E, 18P09K09C05V, 18P09K09C05Q, 18P09K09C10M, 18P09K04P25C, 18P09K04P20L, 18P09K09C05Y, 18P09K09C05Z, 18P09K09D06K, 18P09K09D01A, 18P09K04Q16V, 18P09K09D11B, 18P09K09D01W, 18P09K04Q16L, 18P09K04Q11X, 18P09K09D11I, 18P09K09D06Y, 18P09K09D06D, 18P09K04Q16Y, 18P09K04Q16J, 18P09K04Q16E, 18P09K04Q17Q, 18P09K04Q17A, 18P09K09D12G, 18P09K04Q22W, 18P09K04Q17L, 18P09K09D07M, 18P09K09D02H, 18P09K04Q17S"]
    }

  
  ]

