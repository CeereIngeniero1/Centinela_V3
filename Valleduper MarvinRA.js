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
 


const NombreEquipo = os.hostname();
console.log(" Nombre del equipo: ", NombreEquipo);

const EquipoActual = EquiposGenerales[NombreEquipo];
console.log(" Equipo Actual: ", EquipoActual);

// Actualizado
const Empresa = "Valleduper"; // Collective, NegoYMetales, Freeport, Provenza
const Datos_Empresa = Informacion_Empresas[Empresa];
const Datos_Economicos = Informacion_Economica[Empresa];
const Datos_Geologos = Geologos[Empresa];
const Datos_Contadores = Contadores[Empresa];
// console.log(" Datos de Datos_Geologos: ", Datos_Geologos);
// console.log(" Datos de Datos_Contadores: ", Datos_Contadores);
const user1 = Datos_Empresa.Codigo;
const pass1 = Datos_Empresa.Contraseña;
const user2 = '75967';
const pass2 = 'ANM2020ANNA*';
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

    page.click("#loginButton");
  } catch (ex) {
    console.log("Entro en el catch");
  }

  // page.setDefaultTimeout(0);
  try {
    await page.waitForNavigation({
      waitUntil: "networkidle0",
      timeout: 5000, // 5 segundos en milisegundos
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
    {
      NombreArea: "MARVIN",
      Referencia: "18P09K17A09Z",
      Celdas: ["18P09K17A09Z, 18P09K17A09J, 18P09K12M14Z, 18P09K12M04P, 18P09K17A10Q, 18P09K12M15V, 18P09K12M15K, 18P09K17A05W, 18P09K17A05L, 18P09K12M20W, 18P09K12M20B, 18P09K12M15W, 18P09K12M25X, 18P09K12M20X, 18P09K12M20S, 18P09K12M15S, 18P09K12M05S, 18P09K12M05H, 18P09K12M15T, 18P09K17A05Z, 18P09K12M25P, 18P09K12M05Z, 18P09K12N21F, 18P09K12N16V, 18P09K12N11K, 18P09K12N06Q, 18P09K12N06F, 18P09K12N16L, 18P09K12N06W, 18P09K17B06C, 18P09K12N16S, 18P09K12N11S, 18P09K12N11H, 18P09K17B06D, 18P09K17B01T, 18P09K12N11D, 18P09K12N06I, 18P09K12N01N, 18P09K17B06P, 18P09K17B02Q, 18P09K17B01J, 18P09K17B01E, 18P09K12N17V, 18P09K12N17K, 18P09K12N11U, 18P09K12N06U, 18P09K12N06P, 18P09K12N02V, 18P09K17B07B, 18P09K17B02L, 18P09K12N22W, 18P09K12N22L, 18P09K17B02X, 18P09K12N22S, 18P09K12N17X, 18P09K12N12S, 18P09K17B02Y, 18P09K12N17Y, 18P09K12N12T, 18P09K12N07N, 18P09K12N07I, 18P09K12N02Y, 18P09K17B07J, 18P09K12N22U, 18P09K12N22J, 18P09K12N17Z, 18P09K12N07Z, 18P09K12N07P, 18P09K17B03A, 18P09K12N18F, 18P09K12N08F, 18P09K17B03R, 18P09K17B03G, 18P09K12N18L, 18P09K12N13R, 18P09K12N08W, 18P09K12N03L, 18P09K17B08M, 18P09K12N18S, 18P09K12N13S, 18P09K12N03H, 18P09K17B03D, 18P09K12N18Y, 18P09K12N18N, 18P09K12N13I, 18P09K12N03Y, 18P09K17B03Z, 18P09K12N13U, 18P09K12N13E, 18P09K12N08E, 18P09K17B14A, 18P09K17B04R, 18P09K12N24G, 18P09K12N14W, 18P09K12N14R, 18P09K12N14G, 18P09K12N14A, 18P09K12N09R, 18P09K12N09F, 18P09K12N19S, 18P09K12N09C, 18P09K12N04X, 18P09K12N04M, 18P09K12N24N, 18P09K12N24I, 18P09K12N14Y, 18P09K12N24E, 18P09K12N14U, 18P09K12J24Z, 18P09K17B10V, 18P09K17B10A, 18P09K17B05A, 18P09K12N25K, 18P09K12N15Q, 18P09K12N05V, 18P09K12N05K, 18P09K12J25Q, 18P09K12J25K, 18P09K17B10W, 18P09K17B10L, 18P09K17B10G, 18P09K17B05W, 18P09K17B05R, 18P09K17B05L, 18P09K12N20L, 18P09K12J25B, 18P09K12J20W, 18P09K17B10X, 18P09K17B10M, 18P09K17B10C, 18P09K17B05S, 18P09K12N25X, 18P09K12N10S, 18P09K12N05M, 18P09K12N05C, 18P09K17B05D, 18P09K12N20D, 18P09K12N15Y, 18P09K12N15N, 18P09K12N20Z, 18P09K12N15U, 18P09K12N10Z, 18P09K12N05U, 18P09K12N05J, 18P09K12N05E, 18P09K12J25E, 18P09K12P16Q, 18P09K12P16A, 18P09K12P01A, 18P09K12K21V, 18P09K12K11V, 18P09K17C11B, 18P09K17C06S, 18P09K12P16R, 18P09K12P16L, 18P09K12P11H, 18P09K12P06R, 18P09K12P01S, 18P09K12P01L, 18P09K12K21S, 18P09K12K21H, 18P09K12K16L, 18P09K17C06N, 18P09K12P21Y, 18P09K12P11N, 18P09K12K16Y, 18P09K12K16I, 18P09K12K11Y, 18P09K17C01Z, 18P09K12P21U, 18P09K12P21J, 18P09K12P16Z, 18P09K12P16E, 18P09K12P06U, 18P09K12P06P, 18P09K12K21Z, 18P09K12K21J, 18P09K12K11U, 18P09K12K11P, 18P09K17C07V, 18P09K12P12K, 18P09K12P07F, 18P09K12P07A, 18P09K12K17F, 18P09K17C07B, 18P09K12P22B, 18P09K12P12L, 18P09K12P07W, 18P09K12P02L, 18P09K12K17L, 18P09K12K17G, 18P09K17C07S, 18P09K17C02M, 18P09K17C02H, 18P09K12P07M, 18P09K12P07C, 18P09K12K22S, 18P09K12K22M, 18P09K17C07D, 18P09K17C02I, 18P09K12P12N, 18P09K12P07Y, 18P09K12K22N, 18P09K17C02Z, 18P09K12P02U, 18P09K12K22U, 18P09K12K22J, 18P09K12P23K, 18P09K12P23A, 18P09K12P18Q, 18P09K12P13K, 18P09K12P13A, 18P09K12P03Q, 18P09K12P03A, 18P09K17C08L, 18P09K12P23W, 18P09K12P23L, 18P09K12P13W, 18P09K12P13R, 18P09K12P03G, 18P09K12P03B, 18P09K12K23R, 18P09K17C08N, 18P09K12P23T, 18P09K12P08H, 18P09K12P08I, 18P09K12P03Y, 18P09K12P03H, 18P09K12P03C, 18P09K12P18Z, 18P09K12P13Z, 18P09K12P24A, 18P09K12P14F, 18P09K12P09K, 18P09K12P09F, 18P09K17C04G, 18P09K17C09H, 18P09K12P24S, 18P09K12P24C, 18P09K12P09H, 18P09K12P24D, 18P09K12P19D, 18P09K12P14T, 18P09K17C14E, 18P09K17C09Z, 18P09K17C09U, 18P09K17C04U, 18P09K17C04P, 18P09K12P24J, 18P09K12P19J, 18P09K12P14Z, 18P09K17C05W, 18P09K17C05G, 18P09K12P25R, 18P09K12P25G, 18P09K12P20L, 18P09K17C10S, 18P09K17C10H, 18P09K17C10C, 18P09K17C05C, 18P09K12P15M, 18P09K17C10Y, 18P09K17C10Z, 18P09K17C05T, 18P09K17C05P, 18P09K12P25P, 18P09K12P20Z, 18P09K12P20U, 18P09K12P15Z, 18P09K12P15T, 18P09K12P10J, 18P09K12P05Y, 18P09K12P05I, 18P09K12P05J, 18P09K17D01F, 18P09K12Q16Q, 18P09K12Q01A, 18P09K17D06W, 18P09K17D01R, 18P09K17D01B, 18P09K12Q21R, 18P09K12Q16L, 18P09K12Q11R, 18P09K17D11C, 18P09K17D06C, 18P09K12Q11S, 18P09K17D06Y, 18P09K17D01Y, 18P09K12Q21Y, 18P09K12Q21I, 18P09K12Q01Y, 18P09K17D11E, 18P09K17D06J, 18P09K17D01Z, 18P09K17D01E, 18P09K12Q16E, 18P09K12Q06Z, 18P09K12Q17A, 18P09K12Q07Q, 18P09K12Q02F, 18P09K12Q02A, 18P09K12Q17B, 18P09K12Q12W, 18P09K12Q12L, 18P09K17A14E, 18P09K17A09T, 18P09K17A04Z, 18P09K17A04J, 18P09K17A04E, 18P09K12M24N, 18P09K12M24P, 18P09K12M24J, 18P09K12M14U, 18P09K12M14I, 18P09K12M09D, 18P09K12M09E, 18P09K17A10F, 18P09K12M20Q, 18P09K12M20F, 18P09K12M10F, 18P09K12M25R, 18P09K12M25L, 18P09K12M25G, 18P09K12M05L, 18P09K12M10C, 18P09K17A10Y, 18P09K17A10N, 18P09K17A05N, 18P09K12M05T, 18P09K17A15E, 18P09K17A05P, 18P09K12M20E, 18P09K12M10Z, 18P09K12M10U, 18P09K17B01Q, 18P09K12N21K, 18P09K12N21A, 18P09K12N01Q, 18P09K12N06R, 18P09K12N01R, 18P09K17B06X, 18P09K17B06M, 18P09K17B06H, 18P09K12N21M, 18P09K12N21H, 18P09K12N21C, 18P09K12N06S, 18P09K12N06C, 18P09K12N11Y, 18P09K17B06U, 18P09K17B07Q, 18P09K17B01U, 18P09K12N22Q, 18P09K12N22K, 18P09K12N22F, 18P09K12N11Z, 18P09K12N12V, 18P09K12N01P, 18P09K17B02W, 18P09K17B02B, 18P09K12N22G, 18P09K12N12R, 18P09K12N07L, 18P09K12N07B, 18P09K12N02R, 18P09K12N02L, 18P09K17B02C, 18P09K12N22C, 18P09K12N12X, 18P09K12N07C, 18P09K12N22D, 18P09K12N07Y, 18P09K12N02T, 18P09K17B07P, 18P09K17B02U, 18P09K17B02E, 18P09K12N12U, 18P09K12N02P, 18P09K17B13A, 18P09K17B08Q, 18P09K17B03F, 18P09K12N23V, 18P09K12N23K, 18P09K12N18V, 18P09K12N08Q, 18P09K17B08W, 18P09K12N18B, 18P09K17B03X, 18P09K17B03H, 18P09K12N13H, 18P09K12N13C, 18P09K12N08X, 18P09K12N23I, 18P09K12N18I, 18P09K17B08U, 18P09K12N18P, 18P09K12N03U, 18P09K17B09R, 18P09K17B04L, 18P09K12N24Q, 18P09K12N24B, 18P09K12N19R, 18P09K12N19K, 18P09K12N19A, 18P09K12N14L, 18P09K17B09X, 18P09K17B09H, 18P09K12N24M, 18P09K12N14M, 18P09K12N14C, 18P09K12N09S, 18P09K12N09M, 18P09K12N04S, 18P09K12N04C, 18P09K12J24S, 18P09K17B09Y, 18P09K17B09I, 18P09K17B04D, 18P09K12N19N, 18P09K12N09I, 18P09K17B14E, 18P09K12N24Z, 18P09K12N14P, 18P09K12N09J, 18P09K12N04E, 18P09K12N25A, 18P09K12N20F, 18P09K12N05F, 18P09K12N15W, 18P09K12N15R, 18P09K12N15L, 18P09K12N10W, 18P09K12N05G, 18P09K12N20M, 18P09K12N15S, 18P09K12J25X, 18P09K12J25H, 18P09K12J25C, 18P09K12J20S, 18P09K17B10Y, 18P09K17B10T, 18P09K12N20N, 18P09K12N20I, 18P09K12J25Y, 18P09K12J25N, 18P09K12J20Y, 18P09K12J20I, 18P09K17B10U, 18P09K17B05E, 18P09K12N20P, 18P09K12N10E, 18P09K12J25Z, 18P09K12J20J, 18P09K12P21Q, 18P09K12P06F, 18P09K12P01F, 18P09K12K16V, 18P09K12K16F, 18P09K17C11C, 18P09K17C06R, 18P09K17C06L, 18P09K17C06B, 18P09K17C01W, 18P09K12P21B, 18P09K12P11M, 18P09K12P01R, 18P09K12P01B, 18P09K12K21B, 18P09K12K21C, 18P09K12K11M, 18P09K12P11T, 18P09K12P01Y, 18P09K12K21N, 18P09K17C06Z, 18P09K17C01U, 18P09K12P21Z, 18P09K12P06E, 18P09K12K21U, 18P09K17C02A, 18P09K12P22V, 18P09K12P07Q, 18P09K12K22A, 18P09K12K17K, 18P09K12P22R, 18P09K12P17W, 18P09K12P02B, 18P09K12K22W, 18P09K17C07X, 18P09K17C07M, 18P09K12P17M, 18P09K17C02D, 18P09K12P22Y, 18P09K12P17I, 18P09K12P12I, 18P09K12P02Y, 18P09K17C07P, 18P09K17C02E, 18P09K12P07P, 18P09K17C03F, 18P09K12P18K, 18P09K12K23V, 18P09K17C13B, 18P09K17C03R, 18P09K17C03G, 18P09K12K23W, 18P09K17C03S, 18P09K17C03M, 18P09K17C03T, 18P09K17C03I, 18P09K12P23M, 18P09K12P23C, 18P09K12P23D, 18P09K12P18I, 18P09K12P13S, 18P09K12P13C, 18P09K12P08X, 18P09K12P08T, 18P09K12K23X, 18P09K17C08J, 18P09K17C03Z, 18P09K12P18J, 18P09K12P13U, 18P09K12P13J, 18P09K12P08U, 18P09K12P08J, 18P09K12P08E, 18P09K12P14A, 18P09K17C14B, 18P09K17C09W, 18P09K17C09L, 18P09K17C04R, 18P09K12P19B, 18P09K17C14C, 18P09K17C04C, 18P09K12P24M, 18P09K12P19C, 18P09K12P14M, 18P09K12P09S, 18P09K12P09M, 18P09K17C14D, 18P09K17C09Y, 18P09K17C09I, 18P09K12P24T, 18P09K12P19N, 18P09K12P14N, 18P09K17C04Z, 18P09K17C04J, 18P09K17C05A, 18P09K12P25V, 18P09K12P20Q, 18P09K12P15K, 18P09K12P15A, 18P09K17C10W, 18P09K17C10L, 18P09K17C10G, 18P09K17C05R, 18P09K12P15G, 18P09K17C15C, 18P09K12P25M, 18P09K12P25C, 18P09K12P20S, 18P09K12P10H, 18P09K12P05S, 18P09K12P05H, 18P09K17C15E, 18P09K17C10P, 18P09K12P25Z, 18P09K12P25T, 18P09K12P25N, 18P09K12P25D, 18P09K12P20N, 18P09K12P20I, 18P09K12P20E, 18P09K12P10U, 18P09K17D06A, 18P09K12Q16K, 18P09K12Q11V, 18P09K12Q06R, 18P09K12Q06B, 18P09K12Q01W, 18P09K12Q01L, 18P09K17D01X, 18P09K12Q21S, 18P09K12Q21C, 18P09K12Q11M, 18P09K12Q06H, 18P09K12Q01M, 18P09K17D01I, 18P09K12Q21J, 18P09K12Q11E, 18P09K12Q12K, 18P09K12Q02G, 18P09K12M24Z, 18P09K12M24T, 18P09K12M24U, 18P09K12M24D, 18P09K12M19Z, 18P09K12M09Y, 18P09K12M09P, 18P09K12M04Z, 18P09K17A10A, 18P09K12M25Q, 18P09K12M25F, 18P09K12M20A, 18P09K12M15A, 18P09K12M05V, 18P09K17A10W, 18P09K12M25B, 18P09K12M20G, 18P09K12M15R, 18P09K12M05R, 18P09K17A15C, 18P09K17A10S, 18P09K17A10M, 18P09K17A10C, 18P09K12M15M, 18P09K12M15C, 18P09K12M10S, 18P09K12M05X, 18P09K17A15D, 18P09K17A05Y, 18P09K17A05T, 18P09K12M20I, 18P09K12M10Y, 18P09K12M05I, 18P09K17A10Z, 18P09K12M20P, 18P09K12M15Z, 18P09K17B06V, 18P09K17B01K, 18P09K12N16Q, 18P09K12N16A, 18P09K12N11A, 18P09K12N06K, 18P09K17B11B, 18P09K12N16W, 18P09K12N11L, 18P09K12N06L, 18P09K17B06Y, 18P09K17B01D, 18P09K12N16I, 18P09K12N01T, 18P09K17B07V, 18P09K17B06J, 18P09K17B02K, 18P09K12N22A, 18P09K12N17Q, 18P09K12N16E, 18P09K12N07Q, 18P09K12N01U, 18P09K17B07R, 18P09K17B02R, 18P09K12N22R, 18P09K12N12L, 18P09K12N12B, 18P09K12N12M, 18P09K12N02M, 18P09K12N12I, 18P09K12N07D, 18P09K17B02J, 18P09K12N07J, 18P09K17B08A, 18P09K12N13F, 18P09K12N08A, 18P09K12N03K, 18P09K17B03B, 18P09K12N23R, 18P09K12N23L, 18P09K12N23G, 18P09K17B13C, 18P09K17B08H, 18P09K17B08C, 18P09K17B03M, 18P09K12N18C, 18P09K12N03X, 18P09K17B08Y, 18P09K17B08T, 18P09K17B03I, 18P09K12N23N, 18P09K12N13Y, 18P09K12N08N, 18P09K12N03T, 18P09K12N03N, 18P09K17B08J, 18P09K12N23U, 18P09K12N23J, 18P09K12N18J, 18P09K12N13J, 18P09K12N08P, 18P09K12N03J, 18P09K17B09W, 18P09K17B09K, 18P09K17B04Q, 18P09K12N19V, 18P09K12N19Q, 18P09K12N14Q, 18P09K12N09A, 18P09K12N09B, 18P09K17B04M, 18P09K12N24X, 18P09K12N24H, 18P09K12N09X, 18P09K12N09H, 18P09K17B04I, 18P09K12N19I, 18P09K12N04N, 18P09K17B09E, 18P09K17B04Z, 18P09K17B04J, 18P09K12N24U, 18P09K12N09P, 18P09K12N09E, 18P09K12N04Z, 18P09K17B05Q, 18P09K17B05F, 18P09K12N25Q, 18P09K12N05Q, 18P09K12J25F, 18P09K12N25W, 18P09K12N10R, 18P09K12N10L, 18P09K12N05L, 18P09K12J25G, 18P09K17B05H, 18P09K12N15H, 18P09K12N15C, 18P09K12J20X, 18P09K17B05Y, 18P09K12N25I, 18P09K12N20Y, 18P09K12N10I, 18P09K12N05T, 18P09K12N20U, 18P09K12N20J, 18P09K12N15J, 18P09K12N10J, 18P09K12N05Z, 18P09K12J25U, 18P09K17C06A, 18P09K17C01V, 18P09K17C01Q, 18P09K17C01A, 18P09K12P16K, 18P09K12P06V, 18P09K12P06Q, 18P09K12P06K, 18P09K12P01V, 18P09K12K21K, 18P09K17C06H, 18P09K12P21L, 18P09K12P21M, 18P09K12P16X, 18P09K12P11X, 18P09K12P01M, 18P09K12P01C, 18P09K12K21M, 18P09K12K16R, 18P09K12K11W, 18P09K12K11R, 18P09K12K11S, 18P09K17C01Y, 18P09K17C01T, 18P09K12P06N, 18P09K12K21Y, 18P09K12K21T, 18P09K12K16T, 18P09K17C06P, 18P09K12P16U, 18P09K12P11Z, 18P09K12P11U, 18P09K12P01J, 18P09K12P01E, 18P09K12K16Z, 18P09K12K16E, 18P09K17C07F, 18P09K12P22K, 18P09K12P22F, 18P09K12P17A, 18P09K12P02Q, 18P09K12K17Q, 18P09K12P22G, 18P09K12P17L, 18P09K12P12G, 18P09K17C07H, 18P09K17C02S, 18P09K12P22C, 18P09K12P17X, 18P09K12P17S, 18P09K12P12C, 18P09K12P02M, 18P09K12P22I, 18P09K12P07N, 18P09K12P02N, 18P09K12P22Z, 18P09K12P22E, 18P09K12P07U, 18P09K17C03K, 18P09K12P18A, 18P09K12P08V, 18P09K12P03V, 18P09K17C08G, 18P09K17C08B, 18P09K12P23G, 18P09K12P18W, 18P09K12P08L, 18P09K12P08G, 18P09K12P03L, 18P09K17C08X, 18P09K17C08D, 18P09K17C03Y, 18P09K17C03D, 18P09K12P23S, 18P09K12P13Y, 18P09K12P08N, 18P09K12P08C, 18P09K12P08D, 18P09K17C08U, 18P09K17C03U, 18P09K17C03P, 18P09K17C04F, 18P09K12P19V, 18P09K12P19A, 18P09K12P14K, 18P09K12P19W, 18P09K17C09X, 18P09K17C04X, 18P09K12P19X, 18P09K12P14X, 18P09K12P14S, 18P09K17C09T, 18P09K17C04T, 18P09K17C04I, 18P09K12P24I, 18P09K12P19T, 18P09K12P19I, 18P09K12P14Y, 18P09K17C10V, 18P09K12P20A, 18P09K12P15V, 18P09K17C10R, 18P09K17C10B, 18P09K12P25W, 18P09K12P10X, 18P09K12P05C, 18P09K17C15D, 18P09K17C10U, 18P09K17C10N, 18P09K17C10E, 18P09K17C05U, 18P09K12P25Y, 18P09K12P25U, 18P09K12P20Y, 18P09K12P20D, 18P09K12P15P, 18P09K12P10Z, 18P09K12P10N, 18P09K12P10D, 18P09K12P10E, 18P09K12P05Z, 18P09K17D01V, 18P09K17D01Q, 18P09K17D01K, 18P09K12Q16V, 18P09K12Q16F, 18P09K12Q16A, 18P09K12Q11Q, 18P09K12Q06F, 18P09K17D06R, 18P09K17D01G, 18P09K12Q21L, 18P09K12Q06W, 18P09K12Q06G, 18P09K12Q01B, 18P09K17D01S, 18P09K17D01C, 18P09K12Q16X, 18P09K12Q16H, 18P09K12Q06S, 18P09K12Q01S, 18P09K17D11D, 18P09K17D06N, 18P09K17D06I, 18P09K12Q16N, 18P09K12Q11Y, 18P09K12Q06N, 18P09K17D01J, 18P09K12Q21Z, 18P09K12Q11U, 18P09K12Q11J, 18P09K12Q06J, 18P09K17D02F, 18P09K12Q22Q, 18P09K12Q02K, 18P09K12Q12R, 18P09K12Q12G, 18P09K12Q02R, 18P09K12Q02L, 18P09K17A09U, 18P09K17A09N, 18P09K17A04N, 18P09K17A04U, 18P09K17A04D, 18P09K12M19J, 18P09K12M19E, 18P09K12M14N, 18P09K12M04Y, 18P09K17A15A, 18P09K17A10K, 18P09K12M20V, 18P09K12M10K, 18P09K17A10B, 18P09K17A05G, 18P09K12M20L, 18P09K12M15G, 18P09K12M10W, 18P09K17A10X, 18P09K12M25H, 18P09K12M25C, 18P09K12M10H, 18P09K12M25N, 18P09K12M20D, 18P09K12M10T, 18P09K12M10N, 18P09K12M10D, 18P09K12M05N, 18P09K12M20Z, 18P09K12M15P, 18P09K17B01V, 18P09K17B01A, 18P09K12N16K, 18P09K12N16F, 18P09K12N11F, 18P09K12N01V, 18P09K17B06R, 18P09K12N16R, 18P09K12N11W, 18P09K12N11B, 18P09K12N01G, 18P09K12N21X, 18P09K12N16M, 18P09K12N16H, 18P09K12N11M, 18P09K12N11C, 18P09K12N01M, 18P09K17B01N, 18P09K12N21I, 18P09K12N06Y, 18P09K12N06N, 18P09K12N06D, 18P09K17B11E, 18P09K17B06Z, 18P09K17B02A, 18P09K12N21Z, 18P09K12N16P, 18P09K12N16J, 18P09K12N12Q, 18P09K12N12F, 18P09K12N01Z, 18P09K12N02Q, 18P09K12N01J, 18P09K12N02F, 18P09K12N17L, 18P09K17B07H, 18P09K17B02S, 18P09K12N22H, 18P09K12N17S, 18P09K12N17M, 18P09K12N07M, 18P09K12N02S, 18P09K17B07T, 18P09K17B02N, 18P09K12N12Y, 18P09K17B07E, 18P09K12N17E, 18P09K17B08K, 18P09K12N23Q, 18P09K12N23A, 18P09K12N13Q, 18P09K12N08V, 18P09K12N08K, 18P09K17B13B, 18P09K17B03L, 18P09K12N18W, 18P09K12N13B, 18P09K12N03G, 18P09K17B03C, 18P09K12N13X, 18P09K17B08N, 18P09K12N18D, 18P09K12N13T, 18P09K12N13D, 18P09K17B08Z, 18P09K17B08P, 18P09K12N03Z, 18P09K12N03P, 18P09K17B09Q, 18P09K17B04K, 18P09K17B04G, 18P09K12N24R, 18P09K12N24K, 18P09K12N24L, 18P09K12N24A, 18P09K12N19L, 18P09K12N19G, 18P09K12N09G, 18P09K12N04W, 18P09K12N04R, 18P09K12N04K, 18P09K12N14X, 18P09K12N14H, 18P09K17B04Y, 18P09K12N14T, 18P09K12N09Y, 18P09K12N09N, 18P09K12J24T, 18P09K17B04P, 18P09K12N24P, 18P09K12N19J, 18P09K12N19E, 18P09K12N04P, 18P09K12J24J, 18P09K17B10Q, 18P09K17B05V, 18P09K12N25V, 18P09K12N25F, 18P09K12N15V, 18P09K12N15K, 18P09K12N25M, 18P09K12N25C, 18P09K12N15X, 18P09K17B10N, 18P09K17B05I, 18P09K12N25Y, 18P09K12N20T, 18P09K12N10Y, 18P09K12N05N, 18P09K12J20T, 18P09K17B10J, 18P09K17B10E, 18P09K12N25U, 18P09K12N25E, 18P09K12N15P, 18P09K12N10U, 18P09K12J25J, 18P09K12J20U, 18P09K12J20P, 18P09K17C06Q, 18P09K17C01F, 18P09K12P11K, 18P09K12P06A, 18P09K12P01Q, 18P09K12P01K, 18P09K17C06M, 18P09K17C06C, 18P09K17C01X, 18P09K17C01M, 18P09K17C01B, 18P09K12P16S, 18P09K12P06W, 18P09K12K21W, 18P09K12K16W, 18P09K12K16X, 18P09K12K16S, 18P09K12K16B, 18P09K17C06Y, 18P09K17C06T, 18P09K17C06D, 18P09K17C01I, 18P09K12P11I, 18P09K12P11D, 18P09K12P06I, 18P09K12P01D, 18P09K17C06U, 18P09K17C06E, 18P09K17C01P, 18P09K17C01J, 18P09K12P21E, 18P09K12P12V, 18P09K12P07V, 18P09K12P07K, 18P09K12P02V, 18P09K12P02F, 18P09K12K22V, 18P09K12K22Q, 18P09K12K22K, 18P09K12K22F, 18P09K12K17V, 18P09K17C07W, 18P09K12P22L, 18P09K12P07R, 18P09K17C02X, 18P09K12P22H, 18P09K12P17H, 18P09K12P12X, 18P09K12K22X, 18P09K12P17T, 18P09K12P17N, 18P09K12P12Y, 18P09K12P02D, 18P09K12K22D, 18P09K17C12E, 18P09K17C07U, 18P09K17C07J, 18P09K17C02J, 18P09K12P12U, 18P09K12P12P, 18P09K17C08V, 18P09K17C03A, 18P09K12P18F, 18P09K12P08K, 18P09K12P08A, 18P09K12K23F, 18P09K17C03B, 18P09K12P18R, 18P09K17C08Y, 18P09K12P23Y, 18P09K12P18C, 18P09K12P13T, 18P09K12P13H, 18P09K12P03X, 18P09K12P23U, 18P09K17C09A, 18P09K17C04V, 18P09K12P19F, 18P09K12P14V, 18P09K12P24B, 18P09K12P19G, 18P09K12P14W, 18P09K12P09W, 18P09K12P24X, 18P09K12P19S, 18P09K12P19M, 18P09K12P14H, 18P09K17C09D, 18P09K17C09P, 18P09K17C09E, 18P09K17C04E, 18P09K12P14U, 18P09K17C10Q, 18P09K12P25F, 18P09K12P15Q, 18P09K12P15F, 18P09K17C05L, 18P09K12P05L, 18P09K17C10X, 18P09K12P15H, 18P09K17C10T, 18P09K17C05I, 18P09K12P25E, 18P09K12P15N, 18P09K12P15I, 18P09K12P15J, 18P09K12P10Y, 18P09K12P05N, 18P09K17D06K, 18P09K12Q21A, 18P09K12Q06A, 18P09K12Q01Q, 18P09K12Q01F, 18P09K12Q21G, 18P09K12Q16B, 18P09K12Q11W, 18P09K12Q06L, 18P09K12Q21H, 18P09K17D01N, 18P09K12Q11D, 18P09K12Q01T, 18P09K12Q21U, 18P09K12Q16U, 18P09K12Q01U, 18P09K12Q01J, 18P09K12Q01E, 18P09K17D12A, 18P09K17D07F, 18P09K17D02K, 18P09K12Q12Q, 18P09K12Q12F, 18P09K12Q07W, 18P09K17A09P, 18P09K17A09D, 18P09K17A04T, 18P09K17A04P, 18P09K12M19I, 18P09K12M09Z, 18P09K12M04J, 18P09K17A05Q, 18P09K17A05K, 18P09K17A05A, 18P09K12M25A, 18P09K12M10A, 18P09K17A10L, 18P09K17A10G, 18P09K12M20R, 18P09K17A05S, 18P09K17A05C, 18P09K17A10T, 18P09K17A05I, 18P09K17A10U, 18P09K17A10P, 18P09K17A10E, 18P09K12M25Z, 18P09K12M10E, 18P09K12M05J, 18P09K17B11A, 18P09K12N21V, 18P09K12N06A, 18P09K12N01F, 18P09K17B01B, 18P09K12N16G, 18P09K12N01W, 18P09K17B11C, 18P09K17B01X, 18P09K17B01S, 18P09K12N21S, 18P09K12N11X, 18P09K12N01S, 18P09K17B06I, 18P09K12N21N, 18P09K12N16D, 18P09K17B02V, 18P09K17B01P, 18P09K12N17F, 18P09K12N17A, 18P09K12N12K, 18P09K17B07W, 18P09K17B02G, 18P09K12N17R, 18P09K12N17G, 18P09K12N17B, 18P09K12N07W, 18P09K12N07R, 18P09K17B07C, 18P09K17B02H, 18P09K12N07X, 18P09K17B02D, 18P09K12N22I, 18P09K17B02P, 18P09K12N22E, 18P09K12N17U, 18P09K12N17P, 18P09K12N17J, 18P09K12N12E, 18P09K17B08F, 18P09K12N13V, 18P09K12N13A, 18P09K12N03V, 18P09K17B08G, 18P09K12N13L, 18P09K12N08L, 18P09K12N08B, 18P09K17B08X, 18P09K12N23X, 18P09K12N23M, 18P09K12N23C, 18P09K12N08H, 18P09K12N08C, 18P09K12N03M, 18P09K17B13D, 18P09K17B03Y, 18P09K17B03T, 18P09K17B03N, 18P09K12N03I, 18P09K17B03U, 18P09K12N23Z, 18P09K12N23E, 18P09K12N18E, 18P09K12N08U, 18P09K17B09L, 18P09K17B09F, 18P09K17B04A, 18P09K17B04B, 18P09K12N24V, 18P09K12N04L, 18P09K17B04H, 18P09K12N19X, 18P09K12N19H, 18P09K17B09N, 18P09K17B04T, 18P09K17B04N, 18P09K12N24D, 18P09K12N19T, 18P09K12N14N, 18P09K12N14I, 18P09K12N04Y, 18P09K12N04D, 18P09K12N04U, 18P09K17B15A, 18P09K17B10F, 18P09K17B05K, 18P09K12N20A, 18P09K12N10V, 18P09K12N10A, 18P09K17B05B, 18P09K12N25R, 18P09K12N10G, 18P09K17B05C, 18P09K12N25S, 18P09K12N20C, 18P09K12N10X, 18P09K17B10D, 18P09K17B05N, 18P09K12N25D, 18P09K12N15I, 18P09K12N15D, 18P09K12N10N, 18P09K12N05D, 18P09K17B15E, 18P09K17B10Z, 18P09K17B05Z, 18P09K17B05U, 18P09K17B05J, 18P09K12N10P, 18P09K12N05P, 18P09K12P21F, 18P09K12P16V, 18P09K12P16F, 18P09K17C01R, 18P09K12P21W, 18P09K12P16W, 18P09K12P06B, 18P09K12P06C, 18P09K12P01G, 18P09K12P01H, 18P09K12K16G, 18P09K12K16C, 18P09K17C01N, 18P09K12P06Y, 18P09K12K21I, 18P09K12K16N, 18P09K12P21P, 18P09K12P16J, 18P09K12P06J, 18P09K12K21E, 18P09K17C12A, 18P09K12P22A, 18P09K12P17Q, 18P09K12P17F, 18P09K12K12K, 18P09K17C07R, 18P09K12P17B, 18P09K12P02W, 18P09K12K22R, 18P09K12K22B, 18P09K12P22S, 18P09K12P22M, 18P09K12P12S, 18P09K12P02C, 18P09K17C12D, 18P09K17C07Y, 18P09K17C07T, 18P09K17C07I, 18P09K17C02T, 18P09K12P07T, 18P09K12P07I, 18P09K12P02T, 18P09K12K22T, 18P09K12P22U, 18P09K12P17P, 18P09K12P17J, 18P09K12P02E, 18P09K17C08A, 18P09K12P13Q, 18P09K12P18B, 18P09K17C08T, 18P09K17C08M, 18P09K17C08H, 18P09K17C08I, 18P09K12P18Y, 18P09K12P18H, 18P09K12P13D, 18P09K12P08M, 18P09K12P03S, 18P09K12K23S, 18P09K17C13E, 18P09K12P18U, 18P09K12P13P, 18P09K12P08P, 18P09K17C14A, 18P09K17C09F, 18P09K12P04V, 18P09K17C09R, 18P09K17C04L, 18P09K12P14R, 18P09K17C09S, 18P09K17C09M, 18P09K12P19H, 18P09K12P09X, 18P09K17C04N, 18P09K17C04D, 18P09K12P14I, 18P09K17C09J, 18P09K12P24E, 18P09K12P19Z, 18P09K12P19E, 18P09K17C15B, 18P09K17C05B, 18P09K12P20R, 18P09K12P15W, 18P09K12P15R, 18P09K12P15B, 18P09K12P10W, 18P09K17C05H, 18P09K12P15X, 18P09K12P15S, 18P09K12P10C, 18P09K17C05Z, 18P09K12P20T, 18P09K12P20P, 18P09K12P20J, 18P09K17D01A, 18P09K12Q11F, 18P09K12Q06Q, 18P09K12Q16W, 18P09K12Q16R, 18P09K12Q16M, 18P09K12Q11C, 18P09K12Q01C, 18P09K17D06D, 18P09K12Q21N, 18P09K12Q16T, 18P09K12Q11N, 18P09K12Q06T, 18P09K17D06U, 18P09K17D06E, 18P09K12Q21E, 18P09K12Q01P, 18P09K17D02V, 18P09K17D02A, 18P09K12Q17Q, 18P09K12Q07L, 18P09K12Q02W, 18P09K17A09I, 18P09K17A09E, 18P09K17A04I, 18P09K12M24Y, 18P09K12M24I, 18P09K12M24E, 18P09K12M14P, 18P09K12M04T, 18P09K12M04U, 18P09K12M25K, 18P09K12M20K, 18P09K12M10V, 18P09K12M10Q, 18P09K12M05K, 18P09K17A05R, 18P09K12M15B, 18P09K12M10L, 18P09K12M10G, 18P09K12M10B, 18P09K17A05X, 18P09K12M20C, 18P09K12M15X, 18P09K12M15H, 18P09K12M10X, 18P09K12M10M, 18P09K17A05D, 18P09K12M25T, 18P09K12M20T, 18P09K12M20N, 18P09K12M15Y, 18P09K12M15N, 18P09K12M15I, 18P09K12M15E, 18P09K12M05P, 18P09K17B06Q, 18P09K17B06K, 18P09K12N21Q, 18P09K17B01G, 18P09K12N21G, 18P09K12N11R, 18P09K12N11G, 18P09K12N06B, 18P09K12N16C, 18P09K17B11D, 18P09K17B06T, 18P09K17B06N, 18P09K17B01I, 18P09K12N16Y, 18P09K12N11T, 18P09K12N01Y, 18P09K17B12A, 18P09K17B07K, 18P09K17B06E, 18P09K17B01Z, 18P09K17B02F, 18P09K12N16Z, 18P09K12N11E, 18P09K12N07V, 18P09K12N07K, 18P09K12N07A, 18P09K17B12B, 18P09K17B07X, 18P09K12N17H, 18P09K12N17C, 18P09K12N12C, 18P09K12N07H, 18P09K17B07N, 18P09K17B07D, 18P09K17B02I, 18P09K12N22Y, 18P09K12N22N, 18P09K12N12D, 18P09K12N07T, 18P09K17B07U, 18P09K12N22Z, 18P09K12N12J, 18P09K12N07U, 18P09K12N02Z, 18P09K12N02U, 18P09K17B08V, 18P09K17B03K, 18P09K12N18A, 18P09K12N13K, 18P09K17B08B, 18P09K17B03W, 18P09K12N23W, 18P09K12N08G, 18P09K17B03S, 18P09K12N23H, 18P09K12N08M, 18P09K12N03S, 18P09K17B08I, 18P09K12N23Y, 18P09K12N18T, 18P09K12N13N, 18P09K12N08T, 18P09K17B08E, 18P09K17B03J, 18P09K12N18U, 18P09K12N13Z, 18P09K12N08Z, 18P09K12N08J, 18P09K17B09V, 18P09K12N24W, 18P09K12N19F, 18P09K12N19B, 18P09K12N14B, 18P09K12N09V, 18P09K12N09K, 18P09K12N04Q, 18P09K12N04F, 18P09K17B14C, 18P09K17B09S, 18P09K17B04C, 18P09K12N19M, 18P09K12N04H, 18P09K12J24X, 18P09K12N24Y, 18P09K12N19D, 18P09K12N09T, 18P09K12J24Y, 18P09K17B09Z, 18P09K17B09U, 18P09K17B04U, 18P09K17B04E, 18P09K12N24J, 18P09K12N19Z, 18P09K12N14E, 18P09K12N09U, 18P09K17B10K, 18P09K12N20V, 18P09K12N20Q, 18P09K12N10Q, 18P09K12N10K, 18P09K12J25V, 18P09K12J25A, 18P09K17B15B, 18P09K12N25G, 18P09K12N15B, 18P09K12N05R, 18P09K12N05B, 18P09K12J25W, 18P09K12J25R, 18P09K12J25L, 18P09K17B10S, 18P09K12N10M, 18P09K12N05S, 18P09K17B05T, 18P09K12N25N, 18P09K12N15T, 18P09K12N10T, 18P09K12N10D, 18P09K12N05Y, 18P09K12J25D, 18P09K12N15E, 18P09K12J20Z, 18P09K17C06F, 18P09K17C01K, 18P09K12K16K, 18P09K17C01L, 18P09K17C01H, 18P09K12P21G, 18P09K12P21C, 18P09K12P16C, 18P09K12P11C, 18P09K12P06X, 18P09K12P06S, 18P09K12P06M, 18P09K12P06G, 18P09K12P01W, 18P09K12P01X, 18P09K12P21N, 18P09K12P16Y, 18P09K12P16T, 18P09K12P01N, 18P09K12P01I, 18P09K12K21D, 18P09K12K16D, 18P09K12K11T, 18P09K12K11I, 18P09K12P16P, 18P09K12P11E, 18P09K12K16U, 18P09K12K16J, 18P09K12K11Z, 18P09K12K11J, 18P09K17C07A, 18P09K17C02V, 18P09K17C02Q, 18P09K17C02K, 18P09K17C02F, 18P09K12P17V, 18P09K12P17K, 18P09K12P02A, 18P09K17C02W, 18P09K17C02G, 18P09K17C02B, 18P09K12P22W, 18P09K12P17G, 18P09K12P12R, 18P09K12P12B, 18P09K12P07L, 18P09K12P07B, 18P09K12P02R, 18P09K12K17R, 18P09K17C07C, 18P09K17C02C, 18P09K12P07X, 18P09K12P07H, 18P09K12P02H, 18P09K12K22H, 18P09K17C07N, 18P09K17C02Y, 18P09K12P22T, 18P09K12P07D, 18P09K12K22Y, 18P09K12K22I, 18P09K17C07Z, 18P09K17C07E, 18P09K17C02P, 18P09K12P17Z, 18P09K12P12J, 18P09K17C13A, 18P09K17C08K, 18P09K17C03V, 18P09K12P23V, 18P09K12K23Q, 18P09K12P23R, 18P09K12P18G, 18P09K12P13L, 18P09K12P13G, 18P09K12P13B, 18P09K12P08W, 18P09K12P08B, 18P09K17C13C, 18P09K17C08C, 18P09K12P23H, 18P09K12P18X, 18P09K12P18T, 18P09K12P18N, 18P09K12P13X, 18P09K12P13N, 18P09K12P03T, 18P09K12P03I, 18P09K12P03D, 18P09K17C03J, 18P09K12P13E, 18P09K17C09K, 18P09K17C04K, 18P09K12P24V, 18P09K12P24F, 18P09K12P19K, 18P09K12P14Q, 18P09K12P09A, 18P09K17C04W, 18P09K12P24W, 18P09K12P19L, 18P09K12P14L, 18P09K12P14G, 18P09K12P09R, 18P09K12P09G, 18P09K17C09C, 18P09K12P24H, 18P09K17C09N, 18P09K17C04Y, 18P09K12P24Y, 18P09K12P24N, 18P09K12P14D, 18P09K12P24Z, 18P09K12P24U, 18P09K12P24P, 18P09K12P14P, 18P09K17C10A, 18P09K17C05F, 18P09K12P20W, 18P09K12P20B, 18P09K17C05S, 18P09K12P20X, 18P09K12P20C, 18P09K12P05X, 18P09K12P05M, 18P09K17C10D, 18P09K17C05Y, 18P09K17C05J, 18P09K12P15D, 18P09K12P15E, 18P09K12P10I, 18P09K12P05U, 18P09K12P05D, 18P09K12Q06V, 18P09K12Q06K, 18P09K12Q01K, 18P09K17D06L, 18P09K17D06G, 18P09K17D06B, 18P09K17D01L, 18P09K12Q21W, 18P09K12Q21B, 18P09K12Q11L, 18P09K12Q11G, 18P09K12Q01G, 18P09K17D06S, 18P09K12Q21X, 18P09K12Q16C, 18P09K12Q11X, 18P09K12Q11H, 18P09K12Q06C, 18P09K12Q01H, 18P09K17D06T, 18P09K17D01T, 18P09K12Q16Y, 18P09K12Q16I, 18P09K17D06Z, 18P09K12Q16J, 18P09K12Q06P, 18P09K12Q01Z, 18P09K17D07V, 18P09K17D07K, 18P09K17D07A, 18P09K12Q22V, 18P09K12Q22K, 18P09K12Q22F, 18P09K12Q07K, 18P09K12Q07R, 18P09K17A04Y, 18P09K12M19Y, 18P09K12M19P, 18P09K12M19D, 18P09K12M09N, 18P09K17A05F, 18P09K12M25V, 18P09K12M15Q, 18P09K12M15F, 18P09K12M05Q, 18P09K12M05F, 18P09K17A15B, 18P09K17A10R, 18P09K17A05B, 18P09K12M25W, 18P09K12M15L, 18P09K12M10R, 18P09K12M05W, 18P09K12M05G, 18P09K17A10H, 18P09K17A05H, 18P09K12M25Y, 18P09K12M25I, 18P09K17A05E, 18P09K12M25J, 18P09K12M20U, 18P09K12M20J, 18P09K12M15J, 18P09K12M10J, 18P09K12M05U, 18P09K17B06F, 18P09K17B01F, 18P09K12N06V, 18P09K12N01K, 18P09K17B06W, 18P09K17B06L, 18P09K17B06G, 18P09K17B06B, 18P09K17B01R, 18P09K17B01L, 18P09K12N21W, 18P09K12N21R, 18P09K12N21L, 18P09K12N16B, 18P09K12N06G, 18P09K17B06S, 18P09K17B01H, 18P09K17B01C, 18P09K12N16X, 18P09K12N06X, 18P09K12N06M, 18P09K12N06H, 18P09K12N01H, 18P09K12N21Y, 18P09K12N16T, 18P09K12N11N, 18P09K12N11I, 18P09K12N01I, 18P09K17B07A, 18P09K12N22V, 18P09K12N21P, 18P09K12N21J, 18P09K12N11P, 18P09K12N11J, 18P09K12N06J, 18P09K12N06E, 18P09K12N07F, 18P09K17B07L, 18P09K12N22B, 18P09K12N17W, 18P09K12N12W, 18P09K12N07G, 18P09K12N02G, 18P09K17B07M, 18P09K17B02M, 18P09K12N22X, 18P09K12N22M, 18P09K12N12H, 18P09K12N07S, 18P09K17B12D, 18P09K17B07Y, 18P09K12N17T, 18P09K12N17I, 18P09K12N17D, 18P09K12N02I, 18P09K17B12E, 18P09K17B07Z, 18P09K17B02Z, 18P09K12N22P, 18P09K12N07E, 18P09K12N02J, 18P09K17B03V, 18P09K17B03Q, 18P09K12N18Q, 18P09K12N18K, 18P09K12N03Q, 18P09K12N03F, 18P09K12N23B, 18P09K12N13W, 18P09K12N08R, 18P09K12N03W, 18P09K12N23S, 18P09K12N18X, 18P09K12N18H, 18P09K12N23D, 18P09K12N08D, 18P09K12N23P, 18P09K12N18Z, 18P09K12N13P, 18P09K17B09G, 18P09K17B09B, 18P09K17B04W, 18P09K17B04F, 18P09K12N14V, 18P09K12N14F, 18P09K12N04G, 18P09K17B04S, 18P09K12N19C, 18P09K12N14S, 18P09K17B09D, 18P09K12N14D, 18P09K17B09P, 18P09K17B09J, 18P09K12N19P, 18P09K12N14Z, 18P09K12N14J, 18P09K12N04J, 18P09K12J24U, 18P09K12N15A, 18P09K17B10R, 18P09K17B10B, 18P09K12N25L, 18P09K12N20R, 18P09K17B15C, 18P09K12N20X, 18P09K12N20S, 18P09K12N20H, 18P09K12J25M, 18P09K12J25T, 18P09K17B10P, 18P09K12N25P, 18P09K12N25J, 18P09K12N20E, 18P09K12N15Z, 18P09K17C11A, 18P09K17C06K, 18P09K12P21V, 18P09K12P11F, 18P09K12P11A, 18P09K12K21Q, 18P09K12K21F, 18P09K12K21A, 18P09K12K16Q, 18P09K17C06X, 18P09K17C01S, 18P09K17C01G, 18P09K17C01C, 18P09K12P21X, 18P09K12P16G, 18P09K12P16M, 18P09K12P16H, 18P09K12P16B, 18P09K12P11R, 18P09K12P11S, 18P09K12P11L, 18P09K12P11G, 18P09K12P11B, 18P09K12P06L, 18P09K12P06H, 18P09K12K21X, 18P09K12K21R, 18P09K12K21L, 18P09K12K16H, 18P09K12P21I, 18P09K12P21D, 18P09K12P16N, 18P09K12P16I, 18P09K12P11Y, 18P09K12P06T, 18P09K12P06D, 18P09K12P01T, 18P09K17C11E, 18P09K17C06J, 18P09K12P11J, 18P09K12P06Z, 18P09K12P01Z, 18P09K12P01U, 18P09K12K21P, 18P09K12K16P, 18P09K17C07Q, 18P09K17C07K, 18P09K12P12F, 18P09K17C02R, 18P09K17C02L, 18P09K12P17R, 18P09K12P02G, 18P09K12K22G, 18P09K12P17C, 18P09K12P12M, 18P09K12P12H, 18P09K12P07S, 18P09K12P02X, 18P09K12P02S, 18P09K12K17X, 18P09K17C02N, 18P09K12P17Y, 18P09K12P12Z, 18P09K12P07E, 18P09K12P02P, 18P09K12P02J, 18P09K17C08F, 18P09K17C03Q, 18P09K12P23Q, 18P09K12P23F, 18P09K12P18V, 18P09K12P13F, 18P09K12P03K, 18P09K12P03F, 18P09K12K23K, 18P09K17C08R, 18P09K17C03W, 18P09K12P03W, 18P09K12P03R, 18P09K12K23L, 18P09K17C13D, 18P09K17C08S, 18P09K17C03X, 18P09K17C03N, 18P09K12P23N, 18P09K12P18S, 18P09K12P13I, 18P09K12P08Y, 18P09K12P08S, 18P09K17C08P, 18P09K17C08E, 18P09K12P23Z, 18P09K12P23J, 18P09K12P23E, 18P09K12P18P, 18P09K12P08Z, 18P09K17C09Q, 18P09K17C04A, 18P09K12P19Q, 18P09K12P09Q, 18P09K17C04B, 18P09K12P24R, 18P09K12P19R, 18P09K12P14B, 18P09K17C04S, 18P09K12P19Y, 18P09K17C15A, 18P09K17C10K, 18P09K17C05V, 18P09K17C05Q, 18P09K17C05K, 18P09K12P25K, 18P09K12P20V, 18P09K12P20F, 18P09K12P20G, 18P09K17C05M, 18P09K12P25H, 18P09K12P20M, 18P09K12P15C, 18P09K17C05N, 18P09K17C05D, 18P09K12P15Y, 18P09K12P10P, 18P09K12P05T, 18P09K12P05P, 18P09K17D11A, 18P09K17D06F, 18P09K12Q21V, 18P09K12Q01V, 18P09K17D11B, 18P09K12Q16G, 18P09K12Q11B, 18P09K17D06M, 18P09K17D01M, 18P09K17D01H, 18P09K12Q21M, 18P09K12Q16S, 18P09K12Q06X, 18P09K12Q21T, 18P09K12Q11T, 18P09K12Q11I, 18P09K12Q06Y, 18P09K12Q06D, 18P09K12Q01N, 18P09K12Q01I, 18P09K12Q01D, 18P09K12Q16Z, 18P09K12Q16P, 18P09K12Q11P, 18P09K12Q06E, 18P09K17D07Q, 18P09K12Q17V, 18P09K12Q17F, 18P09K12Q07V, 18P09K12Q07F, 18P09K12Q07A, 18P09K12Q02V, 18P09K12Q02Q, 18P09K12Q17L, 18P09K12Q17G, 18P09K12Q07B, 18P09K17A14D, 18P09K17A09Y, 18P09K12M19T, 18P09K12M19U, 18P09K12M19N, 18P09K12M14Y, 18P09K12M14T, 18P09K12M14J, 18P09K12M14D, 18P09K12M14E, 18P09K12M09T, 18P09K12M09U, 18P09K12M09I, 18P09K12M09J, 18P09K12M04N, 18P09K12M04I, 18P09K17A10V, 18P09K17A05V, 18P09K17A05M, 18P09K12M25S, 18P09K12M25M, 18P09K12M20M, 18P09K12M20H, 18P09K12M05M, 18P09K17A10I, 18P09K17A10D, 18P09K12M25D, 18P09K12M20Y, 18P09K12M15D, 18P09K12M10I, 18P09K12M05Y, 18P09K17A10J, 18P09K17A05U, 18P09K17A05J, 18P09K12M25U, 18P09K12M25E, 18P09K12M15U, 18P09K12M10P, 18P09K17B06A, 18P09K12N11V, 18P09K12N11Q, 18P09K17B01W, 18P09K12N21B, 18P09K12N01L, 18P09K17B01M, 18P09K12N01X, 18P09K17B01Y, 18P09K12N21T, 18P09K12N21D, 18P09K12N16N, 18P09K12N06T, 18P09K17B07F, 18P09K12N21U, 18P09K12N21E, 18P09K12N16U, 18P09K12N12A, 18P09K12N06Z, 18P09K12N02K, 18P09K17B07G, 18P09K12N12G, 18P09K12N02W, 18P09K17B12C, 18P09K17B07S, 18P09K12N02X, 18P09K12N02H, 18P09K17B07I, 18P09K17B02T, 18P09K12N22T, 18P09K12N17N, 18P09K12N12N, 18P09K12N02N, 18P09K12N12Z, 18P09K12N12P, 18P09K12N23F, 18P09K17B08R, 18P09K17B08L, 18P09K12N18R, 18P09K12N18G, 18P09K12N13G, 18P09K12N03R, 18P09K17B08S, 18P09K12N18M, 18P09K12N13M, 18P09K12N08S, 18P09K17B08D, 18P09K12N23T, 18P09K12N08Y, 18P09K12N08I, 18P09K17B13E, 18P09K17B03P, 18P09K17B03E, 18P09K17B14B, 18P09K17B09A, 18P09K17B04V, 18P09K12N24F, 18P09K12N19W, 18P09K12N14K, 18P09K12N09W, 18P09K12N09Q, 18P09K12N09L, 18P09K12N04V, 18P09K17B09M, 18P09K17B09C, 18P09K17B04X, 18P09K12N24S, 18P09K12N24C, 18P09K17B14D, 18P09K17B09T, 18P09K12N24T, 18P09K12N19Y, 18P09K12N09D, 18P09K12N04T, 18P09K12N04I, 18P09K12J24N, 18P09K12N19U, 18P09K12N09Z, 18P09K12J24P, 18P09K12N20K, 18P09K12N15F, 18P09K12N10F, 18P09K12N05A, 18P09K17B05G, 18P09K12N25B, 18P09K12N20W, 18P09K12N20G, 18P09K12N20B, 18P09K12N15G, 18P09K12N10B, 18P09K12N05W, 18P09K17B10H, 18P09K17B05X, 18P09K17B05M, 18P09K12N25H, 18P09K12N15M, 18P09K12N10H, 18P09K12N10C, 18P09K12N05X, 18P09K12N05H, 18P09K12J25S, 18P09K17B15D, 18P09K17B10I, 18P09K12N25T, 18P09K12N05I, 18P09K12J25I, 18P09K12J20N, 18P09K17B05P, 18P09K12N25Z, 18P09K12J25P, 18P09K12J20E, 18P09K17C06V, 18P09K12P21K, 18P09K12P21A, 18P09K12P11V, 18P09K12P11Q, 18P09K12K16A, 18P09K17C06W, 18P09K17C06G, 18P09K12P21R, 18P09K12P21S, 18P09K12P21H, 18P09K12P11W, 18P09K12K21G, 18P09K12K16M, 18P09K12K11X, 18P09K17C11D, 18P09K17C06I, 18P09K17C01D, 18P09K12P21T, 18P09K12P16D, 18P09K12K11N, 18P09K17C01E, 18P09K12P11P, 18P09K12P01P, 18P09K12P22Q, 18P09K12P12Q, 18P09K12P12A, 18P09K12P02K, 18P09K12K12F, 18P09K17C12B, 18P09K17C07L, 18P09K17C07G, 18P09K12P12W, 18P09K12P07G, 18P09K12K22L, 18P09K12K17W, 18P09K17C12C, 18P09K12P22X, 18P09K12K22C, 18P09K12P22N, 18P09K12P22D, 18P09K12P17D, 18P09K12P12T, 18P09K12P12D, 18P09K12P02I, 18P09K17C02U, 18P09K12P22P, 18P09K12P22J, 18P09K12P17U, 18P09K12P17E, 18P09K12P12E, 18P09K12P07Z, 18P09K12P07J, 18P09K12P02Z, 18P09K12K22Z, 18P09K12K22P, 18P09K17C08Q, 18P09K12P13V, 18P09K12P08Q, 18P09K12P08F, 18P09K17C08W, 18P09K17C03L, 18P09K12P23B, 18P09K12P18L, 18P09K12P08R, 18P09K17C03H, 18P09K17C03C, 18P09K12P23X, 18P09K12P23I, 18P09K12P18M, 18P09K12P18D, 18P09K12P13M, 18P09K12P03M, 18P09K12P03N, 18P09K17C08Z, 18P09K17C03E, 18P09K12P23P, 18P09K12P18E, 18P09K12P03Z, 18P09K12P03U, 18P09K12P03P, 18P09K17C09V, 18P09K17C04Q, 18P09K12P24Q, 18P09K12P24K, 18P09K12P09V, 18P09K12P04Q, 18P09K17C09G, 18P09K17C09B, 18P09K12P24L, 18P09K12P24G, 18P09K12P09L, 18P09K12P09B, 18P09K17C04M, 18P09K17C04H, 18P09K12P14C, 18P09K12P19U, 18P09K12P19P, 18P09K12P14J, 18P09K12P14E, 18P09K17C10F, 18P09K12P25Q, 18P09K12P25A, 18P09K12P20K, 18P09K12P25L, 18P09K12P25B, 18P09K12P15L, 18P09K17C10M, 18P09K17C05X, 18P09K12P25X, 18P09K12P25S, 18P09K12P20H, 18P09K17C10I, 18P09K17C10J, 18P09K17C05E, 18P09K12P25I, 18P09K12P25J, 18P09K12P15U, 18P09K12P10T, 18P09K12P05E, 18P09K17D06V, 18P09K17D06Q, 18P09K12Q21Q, 18P09K12Q21K, 18P09K12Q21F, 18P09K12Q11K, 18P09K12Q11A, 18P09K17D01W, 18P09K12Q01R, 18P09K17D06X, 18P09K17D06H, 18P09K12Q06M, 18P09K12Q01X, 18P09K17D01D, 18P09K12Q21D, 18P09K12Q16D, 18P09K12Q06I, 18P09K17D06P, 18P09K17D01U, 18P09K17D01P, 18P09K12Q21P, 18P09K12Q11Z, 18P09K12Q06U, 18P09K17D02Q, 18P09K12Q22A, 18P09K12Q17K, 18P09K12Q12V, 18P09K12Q12A, 18P09K12Q12B, 18P09K12Q07G, 18P09K12Q02B"]
    },
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
  ]



