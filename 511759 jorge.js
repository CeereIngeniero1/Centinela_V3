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
const user2 = '83949';
const pass2 = 'JorgeC2025.';
const Agente = 1;
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
    if (Pines.substring(i + 1, i + 4) == "VL:") {
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
      NombreArea: "511759",
      Referencia: "18P09K08H15B",
      Celdas: ["18P09K08P09E, 18P09K08P05Q, 18P09K08K25W, 18P09K08K25R, 18P09K08P05H, 18P09K08K25I, 18P09K08K25D, 18P09K08K25E, 18P09K08K20Z, 18P09K08L21F, 18P09K08L06A, 18P09K08L16B, 18P09K08L16H, 18P09K08L11H, 18P09K08L11C, 18P09K08L16I, 18P09K08L11Y, 18P09K08L01N, 18P09K08H21Y, 18P09K08L11U, 18P09K08L06Z, 18P09K08L06E, 18P09K08L01J, 18P09K08H21J, 18P09K08H21E, 18P09K08L17G, 18P09K08L12B, 18P09K08L07L, 18P09K08L07B, 18P09K08H22W, 18P09K08L12S, 18P09K08L07X, 18P09K08H17X, 18P09K08L12E, 18P09K08L07J, 18P09K08L02P, 18P09K08H22Y, 18P09K08L13A, 18P09K08L08K, 18P09K08L08A, 18P09K08L03A, 18P09K08H23F, 18P09K08H18Q, 18P09K08L13B, 18P09K08L03G, 18P09K08L03B, 18P09K08H23W, 18P09K08H23G, 18P09K08H18W, 18P09K08L03S, 18P09K08H23S, 18P09K08H13S, 18P09K08L08D, 18P09K08H18D, 18P09K08H13N, 18P09K08L03U, 18P09K08L03E, 18P09K08L09F, 18P09K08L04K, 18P09K08H19A, 18P09K08H24B, 18P09K08H19L, 18P09K08H14L, 18P09K08H14B, 18P09K08H14S, 18P09K08H14M, 18P09K08H14H, 18P09K08H09X, 18P09K08H19Y, 18P09K08H19I, 18P09K08H14Y, 18P09K08H09Y, 18P09K08H24P, 18P09K08H25K, 18P09K08H24J, 18P09K08H20V, 18P09K08H20K, 18P09K08H15A, 18P09K08H20W, 18P09K08H20X, 18P09K08H20H, 18P09K08H15I, 18P09K08H10I, 18P09K08H20Z, 18P09K08H10U, 18P09K08H05U, 18P09K09E11Q, 18P09K09E06V, 18P09K09E06F, 18P09K09E11D, 18P09K08P09I, 18P09K08P09D, 18P09K08P04J, 18P09K08P05L, 18P09K08P05G, 18P09K08K25B, 18P09K08K25S, 18P09K08K20X, 18P09K08K25P, 18P09K08K20U, 18P09K08K15P, 18P09K08K10Z, 18P09K08L16F, 18P09K08L11Q, 18P09K08L11K, 18P09K08L11A, 18P09K08L11L, 18P09K08L06W, 18P09K08L06B, 18P09K08L16C, 18P09K08L01X, 18P09K08L01H, 18P09K08L21D, 18P09K08L11D, 18P09K08L01Y, 18P09K08H21Z, 18P09K08L12Q, 18P09K08L12K, 18P09K08L07K, 18P09K08H22K, 18P09K08H22A, 18P09K08L12R, 18P09K08H22B, 18P09K08L17C, 18P09K08L12C, 18P09K08L07H, 18P09K08H22S, 18P09K08H22H, 18P09K08L12Y, 18P09K08L12T, 18P09K08L12N, 18P09K08L12I, 18P09K08L12J, 18P09K08L07P, 18P09K08L02Y, 18P09K08H22T, 18P09K08H22U, 18P09K08H17N, 18P09K08L03K, 18P09K08L08B, 18P09K08H13W, 18P09K08H23M, 18P09K08H23H, 18P09K08H18C, 18P09K08L08I, 18P09K08L03N, 18P09K08L03D, 18P09K08H13Y, 18P09K08H23U, 18P09K08H23E, 18P09K08H13J, 18P09K08L09A, 18P09K08L04A, 18P09K08H19V, 18P09K08H24L, 18P09K08H14R, 18P09K08L04S, 18P09K08H24S, 18P09K08H24H, 18P09K08H14C, 18P09K08H19T, 18P09K08H19D, 18P09K08H25V, 18P09K08H25F, 18P09K08H19P, 18P09K08H19J, 18P09K08H15K, 18P09K08H14E, 18P09K08H15R, 18P09K08H15L, 18P09K08H15B, 18P09K08H20M, 18P09K08H15X, 18P09K08H20T, 18P09K09E16F, 18P09K09E16A, 18P09K09E11A, 18P09K09E06Q, 18P09K09E16G, 18P09K09E06W, 18P09K09E06L, 18P09K09E16H, 18P09K09E11X, 18P09K09E11H, 18P09K09E11J, 18P09K09E12Q, 18P09K08P09N, 18P09K08P05V, 18P09K08K25Q, 18P09K08K25K, 18P09K08P05D, 18P09K08K20Y, 18P09K08K20M, 18P09K08K20I, 18P09K08K20D, 18P09K08K15T, 18P09K08L21L, 18P09K08L11G, 18P09K08L21H, 18P09K08L11X, 18P09K08L01C, 18P09K08L16T, 18P09K08L06Y, 18P09K08L06I, 18P09K08L16E, 18P09K08L11J, 18P09K08L01E, 18P09K08L12A, 18P09K08L07A, 18P09K08L02Q, 18P09K08L02F, 18P09K08H22V, 18P09K08H22Q, 18P09K08L17B, 18P09K08L12G, 18P09K08L02G, 18P09K08L12M, 18P09K08L12H, 18P09K08L02C, 18P09K08L07Z, 18P09K08L07T, 18P09K08L02D, 18P09K08H22N, 18P09K08H22E, 18P09K08H17Y, 18P09K08L08Q, 18P09K08L03Q, 18P09K08H18V, 18P09K08H23L, 18P09K08H18G, 18P09K08H18B, 18P09K08L03X, 18P09K08H18X, 18P09K08H18M, 18P09K08L03Y, 18P09K08H23Y, 18P09K08H23N, 18P09K08H13T, 18P09K08L03P, 18P09K08H23Z, 18P09K08H23P, 18P09K08H23J, 18P09K08H18U, 18P09K08H13Z, 18P09K08L04V, 18P09K08H24V, 18P09K08L04L, 18P09K08L04G, 18P09K08H19R, 18P09K08H24Y, 18P09K08H19Z, 18P09K08H20Q, 18P09K08H15Q, 18P09K08H25B, 18P09K08H20B, 18P09K08H15H, 18P09K08H10S, 18P09K08H10M, 18P09K08H20Y, 18P09K08H15T, 18P09K08H20P, 18P09K08H15U, 18P09K08H10Z, 18P09K08H10J, 18P09K08H10E, 18P09K09E16V, 18P09K09E11K, 18P09K09E11S, 18P09K09E06M, 18P09K09E16D, 18P09K09E11I, 18P09K09E11U, 18P09K09E12F, 18P09K08P05C, 18P09K08K25H, 18P09K08K20N, 18P09K08K15I, 18P09K08K25J, 18P09K08K20J, 18P09K08K20E, 18P09K08K10U, 18P09K08L21Q, 18P09K08L16V, 18P09K08L11V, 18P09K08L11F, 18P09K08L16L, 18P09K08L01R, 18P09K08L01L, 18P09K08L06H, 18P09K08L06C, 18P09K08L06T, 18P09K08L01D, 18P09K08L06P, 18P09K08L01Z, 18P09K08L01P, 18P09K08L02A, 18P09K08H17V, 18P09K08L07R, 18P09K08L02W, 18P09K08H22L, 18P09K08L12U, 18P09K08L02Z, 18P09K08L02T, 18P09K08L02N, 18P09K08L02I, 18P09K08L02E, 18P09K08H22P, 18P09K08H17Z, 18P09K08H23K, 18P09K08H23A, 18P09K08L08L, 18P09K08H18L, 18P09K08L08S, 18P09K08H18S, 18P09K08L08P, 18P09K08H13U, 18P09K08H13P, 18P09K08H24A, 18P09K08H19F, 18P09K08H14K, 18P09K08H14F, 18P09K08H24X, 18P09K08H19C, 18P09K08H24I, 18P09K08H14T, 18P09K08L04E, 18P09K08L05A, 18P09K08H24U, 18P09K08H25Q, 18P09K08H19E, 18P09K08H14U, 18P09K08H15F, 18P09K08H09P, 18P09K08H20R, 18P09K08H10L, 18P09K08H25H, 18P09K08H20S, 18P09K08H15C, 18P09K08H25I, 18P09K08H20N, 18P09K08H15Y, 18P09K08H15N, 18P09K09E06A, 18P09K09E16L, 18P09K09E11R, 18P09K09E11G, 18P09K09E11M, 18P09K09E06Y, 18P09K08P04U, 18P09K08P05A, 18P09K08K25G, 18P09K08P05I, 18P09K08K20T, 18P09K08K20C, 18P09K08K15Y, 18P09K08K20P, 18P09K08L21A, 18P09K08L16A, 18P09K08L06Q, 18P09K08L11B, 18P09K08L01W, 18P09K08L06M, 18P09K08L01S, 18P09K08L16D, 18P09K08L11T, 18P09K08L16U, 18P09K08L16P, 18P09K08L11E, 18P09K08L06J, 18P09K08L17K, 18P09K08L17F, 18P09K08L07V, 18P09K08L12L, 18P09K08L02R, 18P09K08H22R, 18P09K08H22G, 18P09K08H17W, 18P09K08H17R, 18P09K08L02M, 18P09K08H17S, 18P09K08L12P, 18P09K08L07U, 18P09K08H22Z, 18P09K08H17U, 18P09K08H17P, 18P09K08L13F, 18P09K08L03F, 18P09K08H23Q, 18P09K08H18A, 18P09K08L08W, 18P09K08L08R, 18P09K08H23B, 18P09K08H18R, 18P09K08L08X, 18P09K08L03C, 18P09K08H18H, 18P09K08H13X, 18P09K08L08J, 18P09K08L08E, 18P09K08H18E, 18P09K08H14Q, 18P09K08H24G, 18P09K08H14G, 18P09K08L04H, 18P09K08H24M, 18P09K08H19X, 18P09K08H19M, 18P09K08H24D, 18P09K08H14N, 18P09K08H15V, 18P09K08H14J, 18P09K08H10W, 18P09K08H15M, 18P09K08H10X, 18P09K08H20I, 18P09K08H10Y, 18P09K08H10T, 18P09K08H20U, 18P09K08H20J, 18P09K08H20E, 18P09K08H15P, 18P09K08H15J, 18P09K08H05Z, 18P09K09E16Q, 18P09K09E06K, 18P09K09E16B, 18P09K09E11L, 18P09K09E06B, 18P09K09E16C, 18P09K09E06S, 18P09K09E11T, 18P09K09E11N, 18P09K09E06T, 18P09K09E11P, 18P09K09E11E, 18P09K08P04Z, 18P09K08P05R, 18P09K08K20W, 18P09K08P05M, 18P09K08K25M, 18P09K08K20S, 18P09K08K15J, 18P09K08L21K, 18P09K08L06K, 18P09K08L06F, 18P09K08L21G, 18P09K08L21B, 18P09K08L06R, 18P09K08L06L, 18P09K08L21C, 18P09K08L16M, 18P09K08L01M, 18P09K08L16Y, 18P09K08L06N, 18P09K08L01I, 18P09K08H21T, 18P09K08H21I, 18P09K08L06U, 18P09K08L01U, 18P09K08H21P, 18P09K08L12V, 18P09K08L12F, 18P09K08L07Q, 18P09K08L02K, 18P09K08L12W, 18P09K08L07W, 18P09K08L07G, 18P09K08L07S, 18P09K08L07M, 18P09K08L07C, 18P09K08L02X, 18P09K08H22C, 18P09K08L07N, 18P09K08L02J, 18P09K08H22I, 18P09K08H22D, 18P09K08H17T, 18P09K08L08V, 18P09K08H23V, 18P09K08H18K, 18P09K08L08C, 18P09K08H23C, 18P09K08L08N, 18P09K08H23D, 18P09K08H18T, 18P09K08H18Z, 18P09K08H18P, 18P09K08L04F, 18P09K08H24R, 18P09K08H19S, 18P09K08L04I, 18P09K08L04D, 18P09K08H24T, 18P09K08H24N, 18P09K08H19N, 18P09K08H24E, 18P09K08H14Z, 18P09K08H10V, 18P09K08H09U, 18P09K08H25W, 18P09K08H20G, 18P09K08H15W, 18P09K08H25C, 18P09K08H15S, 18P09K08H20D, 18P09K08H15D, 18P09K08H10N, 18P09K09E11V, 18P09K09E12K, 18P09K08P04P, 18P09K08P05K, 18P09K08K25V, 18P09K08K25X, 18P09K08K25Y, 18P09K08K25T, 18P09K08K25N, 18P09K08K20H, 18P09K08K15N, 18P09K08K25Z, 18P09K08K25U, 18P09K08K15Z, 18P09K08L16K, 18P09K08L16G, 18P09K08L06G, 18P09K08L16X, 18P09K08L16S, 18P09K08H21X, 18P09K08L16N, 18P09K08L11N, 18P09K08L06D, 18P09K08L01T, 18P09K08H21N, 18P09K08L16Z, 18P09K08L16J, 18P09K08L11Z, 18P09K08H21U, 18P09K08H22F, 18P09K08H17M, 18P09K08L07Y, 18P09K08L07D, 18P09K08L07E, 18P09K08H17I, 18P09K08L08F, 18P09K08L03V, 18P09K08L03R, 18P09K08L03L, 18P09K08H23R, 18P09K08L03M, 18P09K08L03H, 18P09K08H23X, 18P09K08L03T, 18P09K08L03I, 18P09K08H23I, 18P09K08H18N, 18P09K08H18I, 18P09K08L03J, 18P09K08H24Q, 18P09K08H19Q, 18P09K08H19K, 18P09K08L04W, 18P09K08L04R, 18P09K08L04B, 18P09K08H24W, 18P09K08H19B, 18P09K08H14W, 18P09K08L04M, 18P09K08H24C, 18P09K08H14X, 18P09K08H09T, 18P09K08H25A, 18P09K08H10Q, 18P09K08H25G, 18P09K08H25M, 18P09K08H10C, 18P09K08H25D, 18P09K08H15Z, 18P09K09E16R, 18P09K09E11W, 18P09K09E06R, 18P09K09E06G, 18P09K09E06Z, 18P09K08P05F, 18P09K08P05B, 18P09K08K25L, 18P09K08K25C, 18P09K08K15U, 18P09K08K15E, 18P09K08L16Q, 18P09K08L06V, 18P09K08L16W, 18P09K08L16R, 18P09K08L11W, 18P09K08L11R, 18P09K08L11S, 18P09K08L11M, 18P09K08L06X, 18P09K08L06S, 18P09K08L11I, 18P09K08L11P, 18P09K08L17A, 18P09K08L07F, 18P09K08L02V, 18P09K08L02L, 18P09K08L02B, 18P09K08L12X, 18P09K08L02S, 18P09K08L02H, 18P09K08H22X, 18P09K08H22M, 18P09K08L12D, 18P09K08L07I, 18P09K08L02U, 18P09K08H22J, 18P09K08H17J, 18P09K08H18F, 18P09K08L08G, 18P09K08L03W, 18P09K08L08M, 18P09K08L08H, 18P09K08L08T, 18P09K08H23T, 18P09K08H18Y, 18P09K08L03Z, 18P09K08H18J, 18P09K08L04Q, 18P09K08H24K, 18P09K08H24F, 18P09K08H14V, 18P09K08H19W, 18P09K08H19G, 18P09K08L04C, 18P09K08H19H, 18P09K08L04N, 18P09K08H14I, 18P09K08H14D, 18P09K08L04J, 18P09K08H24Z, 18P09K08H19U, 18P09K08H20F, 18P09K08H20A, 18P09K08H14P, 18P09K08H09Z, 18P09K08H10K, 18P09K08H25R, 18P09K08H25L, 18P09K08H20L, 18P09K08H15G, 18P09K08H10R, 18P09K08H10G, 18P09K08H20C, 18P09K08H10H, 18P09K08H10D, 18P09K08H05Y, 18P09K08H25E, 18P09K08H15E, 18P09K08H10P, 18P09K09E16K, 18P09K09E11F, 18P09K09E01V, 18P09K09E11B, 18P09K09E11C, 18P09K09E06X, 18P09K09E11Y, 18P09K09E11Z, 18P09K09E12L"]
    }
    
  ]



