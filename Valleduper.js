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
      Referencia: "18P09K08P09E",
      Celdas: ["18P09K08P09E, 18P09K08P05Q, 18P09K08K25W, 18P09K08K25R, 18P09K08P05H, 18P09K08K25I, 18P09K08K25D, 18P09K08K25E, 18P09K08K20Z, 18P09K08L21F, 18P09K08L06A, 18P09K08L16B, 18P09K08L16H, 18P09K08L11H, 18P09K08L11C, 18P09K08L16I, 18P09K08L11Y, 18P09K08L01N, 18P09K08H21Y, 18P09K08L11U, 18P09K08L06Z, 18P09K08L06E, 18P09K08L01J, 18P09K08H21J, 18P09K08H21E, 18P09K08L17G, 18P09K08L12B, 18P09K08L07L, 18P09K08L07B, 18P09K08H22W, 18P09K08L12S, 18P09K08L07X, 18P09K08H17X, 18P09K08L12E, 18P09K08L07J, 18P09K08L02P, 18P09K08H22Y, 18P09K08L13A, 18P09K08L08K, 18P09K08L08A, 18P09K08L03A, 18P09K08H23F, 18P09K08H18Q, 18P09K08L13B, 18P09K08L03G, 18P09K08L03B, 18P09K08H23W, 18P09K08H23G, 18P09K08H18W, 18P09K08L03S, 18P09K08H23S, 18P09K08H13S, 18P09K08L08D, 18P09K08H18D, 18P09K08H13N, 18P09K08L03U, 18P09K08L03E, 18P09K08L09F, 18P09K08L04K, 18P09K08H19A, 18P09K08H24B, 18P09K08H19L, 18P09K08H14L, 18P09K08H14B, 18P09K08H14S, 18P09K08H14M, 18P09K08H14H, 18P09K08H09X, 18P09K08H19Y, 18P09K08H19I, 18P09K08H14Y, 18P09K08H09Y, 18P09K08H24P, 18P09K08H25K, 18P09K08H24J, 18P09K08H20V, 18P09K08H20K, 18P09K08H15A, 18P09K08H20W, 18P09K08H20X, 18P09K08H20H, 18P09K08H15I, 18P09K08H10I, 18P09K08H20Z, 18P09K08H10U, 18P09K08H05U, 18P09K09E11Q, 18P09K09E06V, 18P09K09E06F, 18P09K09E11D, 18P09K08P09I, 18P09K08P09D, 18P09K08P04J, 18P09K08P05L, 18P09K08P05G, 18P09K08K25B, 18P09K08K25S, 18P09K08K20X, 18P09K08K25P, 18P09K08K20U, 18P09K08K15P, 18P09K08K10Z, 18P09K08L16F, 18P09K08L11Q, 18P09K08L11K, 18P09K08L11A, 18P09K08L11L, 18P09K08L06W, 18P09K08L06B, 18P09K08L16C, 18P09K08L01X, 18P09K08L01H, 18P09K08L21D, 18P09K08L11D, 18P09K08L01Y, 18P09K08H21Z, 18P09K08L12Q, 18P09K08L12K, 18P09K08L07K, 18P09K08H22K, 18P09K08H22A, 18P09K08L12R, 18P09K08H22B, 18P09K08L17C, 18P09K08L12C, 18P09K08L07H, 18P09K08H22S, 18P09K08H22H, 18P09K08L12Y, 18P09K08L12T, 18P09K08L12N, 18P09K08L12I, 18P09K08L12J, 18P09K08L07P, 18P09K08L02Y, 18P09K08H22T, 18P09K08H22U, 18P09K08H17N, 18P09K08L03K, 18P09K08L08B, 18P09K08H13W, 18P09K08H23M, 18P09K08H23H, 18P09K08H18C, 18P09K08L08I, 18P09K08L03N, 18P09K08L03D, 18P09K08H13Y, 18P09K08H23U, 18P09K08H23E, 18P09K08H13J, 18P09K08L09A, 18P09K08L04A, 18P09K08H19V, 18P09K08H24L, 18P09K08H14R, 18P09K08L04S, 18P09K08H24S, 18P09K08H24H, 18P09K08H14C, 18P09K08H19T, 18P09K08H19D, 18P09K08H25V, 18P09K08H25F, 18P09K08H19P, 18P09K08H19J, 18P09K08H15K, 18P09K08H14E, 18P09K08H15R, 18P09K08H15L, 18P09K08H15B, 18P09K08H20M, 18P09K08H15X, 18P09K08H20T, 18P09K09E16F, 18P09K09E16A, 18P09K09E11A, 18P09K09E06Q, 18P09K09E16G, 18P09K09E06W, 18P09K09E06L, 18P09K09E16H, 18P09K09E11X, 18P09K09E11H, 18P09K09E11J, 18P09K09E12Q, 18P09K08P09N, 18P09K08P05V, 18P09K08K25Q, 18P09K08K25K, 18P09K08P05D, 18P09K08K20Y, 18P09K08K20M, 18P09K08K20I, 18P09K08K20D, 18P09K08K15T, 18P09K08L21L, 18P09K08L11G, 18P09K08L21H, 18P09K08L11X, 18P09K08L01C, 18P09K08L16T, 18P09K08L06Y, 18P09K08L06I, 18P09K08L16E, 18P09K08L11J, 18P09K08L01E, 18P09K08L12A, 18P09K08L07A, 18P09K08L02Q, 18P09K08L02F, 18P09K08H22V, 18P09K08H22Q, 18P09K08L17B, 18P09K08L12G, 18P09K08L02G, 18P09K08L12M, 18P09K08L12H, 18P09K08L02C, 18P09K08L07Z, 18P09K08L07T, 18P09K08L02D, 18P09K08H22N, 18P09K08H22E, 18P09K08H17Y, 18P09K08L08Q, 18P09K08L03Q, 18P09K08H18V, 18P09K08H23L, 18P09K08H18G, 18P09K08H18B, 18P09K08L03X, 18P09K08H18X, 18P09K08H18M, 18P09K08L03Y, 18P09K08H23Y, 18P09K08H23N, 18P09K08H13T, 18P09K08L03P, 18P09K08H23Z, 18P09K08H23P, 18P09K08H23J, 18P09K08H18U, 18P09K08H13Z, 18P09K08L04V, 18P09K08H24V, 18P09K08L04L, 18P09K08L04G, 18P09K08H19R, 18P09K08H24Y, 18P09K08H19Z, 18P09K08H20Q, 18P09K08H15Q, 18P09K08H25B, 18P09K08H20B, 18P09K08H15H, 18P09K08H10S, 18P09K08H10M, 18P09K08H20Y, 18P09K08H15T, 18P09K08H20P, 18P09K08H15U, 18P09K08H10Z, 18P09K08H10J, 18P09K08H10E, 18P09K09E16V, 18P09K09E11K, 18P09K09E11S, 18P09K09E06M, 18P09K09E16D, 18P09K09E11I, 18P09K09E11U, 18P09K09E12F, 18P09K08P05C, 18P09K08K25H, 18P09K08K20N, 18P09K08K15I, 18P09K08K25J, 18P09K08K20J, 18P09K08K20E, 18P09K08K10U, 18P09K08L21Q, 18P09K08L16V, 18P09K08L11V, 18P09K08L11F, 18P09K08L16L, 18P09K08L01R, 18P09K08L01L, 18P09K08L06H, 18P09K08L06C, 18P09K08L06T, 18P09K08L01D, 18P09K08L06P, 18P09K08L01Z, 18P09K08L01P, 18P09K08L02A, 18P09K08H17V, 18P09K08L07R, 18P09K08L02W, 18P09K08H22L, 18P09K08L12U, 18P09K08L02Z, 18P09K08L02T, 18P09K08L02N, 18P09K08L02I, 18P09K08L02E, 18P09K08H22P, 18P09K08H17Z, 18P09K08H23K, 18P09K08H23A, 18P09K08L08L, 18P09K08H18L, 18P09K08L08S, 18P09K08H18S, 18P09K08L08P, 18P09K08H13U, 18P09K08H13P, 18P09K08H24A, 18P09K08H19F, 18P09K08H14K, 18P09K08H14F, 18P09K08H24X, 18P09K08H19C, 18P09K08H24I, 18P09K08H14T, 18P09K08L04E, 18P09K08L05A, 18P09K08H24U, 18P09K08H25Q, 18P09K08H19E, 18P09K08H14U, 18P09K08H15F, 18P09K08H09P, 18P09K08H20R, 18P09K08H10L, 18P09K08H25H, 18P09K08H20S, 18P09K08H15C, 18P09K08H25I, 18P09K08H20N, 18P09K08H15Y, 18P09K08H15N, 18P09K09E06A, 18P09K09E16L, 18P09K09E11R, 18P09K09E11G, 18P09K09E11M, 18P09K09E06Y, 18P09K08P04U, 18P09K08P05A, 18P09K08K25G, 18P09K08P05I, 18P09K08K20T, 18P09K08K20C, 18P09K08K15Y, 18P09K08K20P, 18P09K08L21A, 18P09K08L16A, 18P09K08L06Q, 18P09K08L11B, 18P09K08L01W, 18P09K08L06M, 18P09K08L01S, 18P09K08L16D, 18P09K08L11T, 18P09K08L16U, 18P09K08L16P, 18P09K08L11E, 18P09K08L06J, 18P09K08L17K, 18P09K08L17F, 18P09K08L07V, 18P09K08L12L, 18P09K08L02R, 18P09K08H22R, 18P09K08H22G, 18P09K08H17W, 18P09K08H17R, 18P09K08L02M, 18P09K08H17S, 18P09K08L12P, 18P09K08L07U, 18P09K08H22Z, 18P09K08H17U, 18P09K08H17P, 18P09K08L13F, 18P09K08L03F, 18P09K08H23Q, 18P09K08H18A, 18P09K08L08W, 18P09K08L08R, 18P09K08H23B, 18P09K08H18R, 18P09K08L08X, 18P09K08L03C, 18P09K08H18H, 18P09K08H13X, 18P09K08L08J, 18P09K08L08E, 18P09K08H18E, 18P09K08H14Q, 18P09K08H24G, 18P09K08H14G, 18P09K08L04H, 18P09K08H24M, 18P09K08H19X, 18P09K08H19M, 18P09K08H24D, 18P09K08H14N, 18P09K08H15V, 18P09K08H14J, 18P09K08H10W, 18P09K08H15M, 18P09K08H10X, 18P09K08H20I, 18P09K08H10Y, 18P09K08H10T, 18P09K08H20U, 18P09K08H20J, 18P09K08H20E, 18P09K08H15P, 18P09K08H15J, 18P09K08H05Z, 18P09K09E16Q, 18P09K09E06K, 18P09K09E16B, 18P09K09E11L, 18P09K09E06B, 18P09K09E16C, 18P09K09E06S, 18P09K09E11T, 18P09K09E11N, 18P09K09E06T, 18P09K09E11P, 18P09K09E11E, 18P09K08P04Z, 18P09K08P05R, 18P09K08K20W, 18P09K08P05M, 18P09K08K25M, 18P09K08K20S, 18P09K08K15J, 18P09K08L21K, 18P09K08L06K, 18P09K08L06F, 18P09K08L21G, 18P09K08L21B, 18P09K08L06R, 18P09K08L06L, 18P09K08L21C, 18P09K08L16M, 18P09K08L01M, 18P09K08L16Y, 18P09K08L06N, 18P09K08L01I, 18P09K08H21T, 18P09K08H21I, 18P09K08L06U, 18P09K08L01U, 18P09K08H21P, 18P09K08L12V, 18P09K08L12F, 18P09K08L07Q, 18P09K08L02K, 18P09K08L12W, 18P09K08L07W, 18P09K08L07G, 18P09K08L07S, 18P09K08L07M, 18P09K08L07C, 18P09K08L02X, 18P09K08H22C, 18P09K08L07N, 18P09K08L02J, 18P09K08H22I, 18P09K08H22D, 18P09K08H17T, 18P09K08L08V, 18P09K08H23V, 18P09K08H18K, 18P09K08L08C, 18P09K08H23C, 18P09K08L08N, 18P09K08H23D, 18P09K08H18T, 18P09K08H18Z, 18P09K08H18P, 18P09K08L04F, 18P09K08H24R, 18P09K08H19S, 18P09K08L04I, 18P09K08L04D, 18P09K08H24T, 18P09K08H24N, 18P09K08H19N, 18P09K08H24E, 18P09K08H14Z, 18P09K08H10V, 18P09K08H09U, 18P09K08H25W, 18P09K08H20G, 18P09K08H15W, 18P09K08H25C, 18P09K08H15S, 18P09K08H20D, 18P09K08H15D, 18P09K08H10N, 18P09K09E11V, 18P09K09E12K, 18P09K08P04P, 18P09K08P05K, 18P09K08K25V, 18P09K08K25X, 18P09K08K25Y, 18P09K08K25T, 18P09K08K25N, 18P09K08K20H, 18P09K08K15N, 18P09K08K25Z, 18P09K08K25U, 18P09K08K15Z, 18P09K08L16K, 18P09K08L16G, 18P09K08L06G, 18P09K08L16X, 18P09K08L16S, 18P09K08H21X, 18P09K08L16N, 18P09K08L11N, 18P09K08L06D, 18P09K08L01T, 18P09K08H21N, 18P09K08L16Z, 18P09K08L16J, 18P09K08L11Z, 18P09K08H21U, 18P09K08H22F, 18P09K08H17M, 18P09K08L07Y, 18P09K08L07D, 18P09K08L07E, 18P09K08H17I, 18P09K08L08F, 18P09K08L03V, 18P09K08L03R, 18P09K08L03L, 18P09K08H23R, 18P09K08L03M, 18P09K08L03H, 18P09K08H23X, 18P09K08L03T, 18P09K08L03I, 18P09K08H23I, 18P09K08H18N, 18P09K08H18I, 18P09K08L03J, 18P09K08H24Q, 18P09K08H19Q, 18P09K08H19K, 18P09K08L04W, 18P09K08L04R, 18P09K08L04B, 18P09K08H24W, 18P09K08H19B, 18P09K08H14W, 18P09K08L04M, 18P09K08H24C, 18P09K08H14X, 18P09K08H09T, 18P09K08H25A, 18P09K08H10Q, 18P09K08H25G, 18P09K08H25M, 18P09K08H10C, 18P09K08H25D, 18P09K08H15Z, 18P09K09E16R, 18P09K09E11W, 18P09K09E06R, 18P09K09E06G, 18P09K09E06Z, 18P09K08P05F, 18P09K08P05B, 18P09K08K25L, 18P09K08K25C, 18P09K08K15U, 18P09K08K15E, 18P09K08L16Q, 18P09K08L06V, 18P09K08L16W, 18P09K08L16R, 18P09K08L11W, 18P09K08L11R, 18P09K08L11S, 18P09K08L11M, 18P09K08L06X, 18P09K08L06S, 18P09K08L11I, 18P09K08L11P, 18P09K08L17A, 18P09K08L07F, 18P09K08L02V, 18P09K08L02L, 18P09K08L02B, 18P09K08L12X, 18P09K08L02S, 18P09K08L02H, 18P09K08H22X, 18P09K08H22M, 18P09K08L12D, 18P09K08L07I, 18P09K08L02U, 18P09K08H22J, 18P09K08H17J, 18P09K08H18F, 18P09K08L08G, 18P09K08L03W, 18P09K08L08M, 18P09K08L08H, 18P09K08L08T, 18P09K08H23T, 18P09K08H18Y, 18P09K08L03Z, 18P09K08H18J, 18P09K08L04Q, 18P09K08H24K, 18P09K08H24F, 18P09K08H14V, 18P09K08H19W, 18P09K08H19G, 18P09K08L04C, 18P09K08H19H, 18P09K08L04N, 18P09K08H14I, 18P09K08H14D, 18P09K08L04J, 18P09K08H24Z, 18P09K08H19U, 18P09K08H20F, 18P09K08H20A, 18P09K08H14P, 18P09K08H09Z, 18P09K08H10K, 18P09K08H25R, 18P09K08H25L, 18P09K08H20L, 18P09K08H15G, 18P09K08H10R, 18P09K08H10G, 18P09K08H20C, 18P09K08H10H, 18P09K08H10D, 18P09K08H05Y, 18P09K08H25E, 18P09K08H15E, 18P09K08H10P, 18P09K09E16K, 18P09K09E11F, 18P09K09E01V, 18P09K09E11B, 18P09K09E11C, 18P09K09E06X, 18P09K09E11Y, 18P09K09E11Z, 18P09K09E12L"]
    },
    {
      NombreArea: "OBD-15061",
      Referencia: "18P09K04J22H",
      Celdas: ["18P09K04J22H, 18P09K04J22D, 18P09K04J12D, 18P09K04J22U, 18P09K04J23W, 18P09K04J18H, 18P09K04J13M, 18P09K04J23Y, 18P09K04J23P, 18P09K04J18Y, 18P09K04J18D, 18P09K04J13T, 18P09K04J13D, 18P09K04J13J, 18P09K04J24V, 18P09K04J14K, 18P09K04J24W, 18P09K04J24L, 18P09K04J22M, 18P09K04J17T, 18P09K04J22P, 18P09K04J22E, 18P09K04J12Z, 18P09K04J23K, 18P09K04J18Q, 18P09K04J18A, 18P09K04J23R, 18P09K04J23L, 18P09K04J18L, 18P09K04J18B, 18P09K04J18C, 18P09K04J23Z, 18P09K04J18Z, 18P09K04J13Z, 18P09K04J13N, 18P09K04J24Q, 18P09K04J19V, 18P09K04J14V, 18P09K04J14A, 18P09K04J14R, 18P09K04J17S, 18P09K04J17M, 18P09K04J17H, 18P09K04J12M, 18P09K04J22T, 18P09K04J23V, 18P09K04J23F, 18P09K04J18V, 18P09K04J13F, 18P09K04J23B, 18P09K04J18R, 18P09K04J13R, 18P09K04J23X, 18P09K04J18M, 18P09K04J13X, 18P09K04J23T, 18P09K04J13U, 18P09K04J24K, 18P09K04J24R, 18P09K04J14L, 18P09K04J17X, 18P09K04J12H, 18P09K04J12C, 18P09K04J17D, 18P09K04J12N, 18P09K04J13K, 18P09K04J13L, 18P09K04J13G, 18P09K04J23C, 18P09K04J18I, 18P09K04J13Y, 18P09K04J13I, 18P09K04J14B, 18P09K04J22S, 18P09K04J22C, 18P09K04J12S, 18P09K04J22I, 18P09K04J17N, 18P09K04J12T, 18P09K04J22J, 18P09K04J13Q, 18P09K04J13A, 18P09K04J23G, 18P09K04J18W, 18P09K04J18G, 18P09K04J13B, 18P09K04J23S, 18P09K04J13S, 18P09K04J13C, 18P09K04J23U, 18P09K04J23I, 18P09K04J18J, 18P09K04J24F, 18P09K04J24A, 18P09K04J14F, 18P09K04J19L, 18P09K04J19G, 18P09K04J19B, 18P09K04J14G, 18P09K04J17C, 18P09K04J17I, 18P09K04J12I, 18P09K04J17E, 18P09K04J12P, 18P09K04J23A, 18P09K04J18F, 18P09K04J18X, 18P09K04J18S, 18P09K04J13H, 18P09K04J23J, 18P09K04J23D, 18P09K04J23E, 18P09K04J18T, 18P09K04J13P, 18P09K04J19Q, 18P09K04J14Q, 18P09K04J19W, 18P09K04J19R, 18P09K04J12X, 18P09K04J22N, 18P09K04J17Y, 18P09K04J12Y, 18P09K04J17Z, 18P09K04J17U, 18P09K04J17P, 18P09K04J12U, 18P09K04J13V, 18P09K04J18U, 18P09K04J18P, 18P09K04J18E, 18P09K04J19K, 18P09K04J19F, 18P09K04J19A, 18P09K04J24G, 18P09K04J24B, 18P09K04J14W, 18P09K04J17J, 18P09K04J12J, 18P09K04J12E, 18P09K04J23Q, 18P09K04J18K, 18P09K04J13W, 18P09K04J23M, 18P09K04J23H, 18P09K04J23N, 18P09K04J18N, 18P09K04J13E"]
    },
    {
      NombreArea: "507531",
      Referencia: "18P09K21D02I",
      Celdas: ["18P09K04K05R, 18P09K04K05S, 18P09K04K05B, 18P09K04G25W, 18P09K04K10T, 18P09K04K10I, 18P09K04G25I, 18P09K04K10P, 18P09K04K10J, 18P09K04G25J, 18P09K04G25E, 18P09K04L06F, 18P09K04L01K, 18P09K04H21Q, 18P09K04H21K, 18P09K04H21A, 18P09K04L06L, 18P09K04L01W, 18P09K04L01L, 18P09K04H21H, 18P09K04L06T, 18P09K04L01T, 18P09K04L01I, 18P09K04H21I, 18P09K04H21D, 18P09K04H21U, 18P09K04K10B, 18P09K04K05G, 18P09K04K05Y, 18P09K04K05N, 18P09K04G25D, 18P09K04K05J, 18P09K04L06Q, 18P09K04L01V, 18P09K04L01R, 18P09K04L01G, 18P09K04L06H, 18P09K04L06C, 18P09K04L06P, 18P09K04L01U, 18P09K04L07A, 18P09K04H22A, 18P09K04K05C, 18P09K04G25B, 18P09K04K10D, 18P09K04K05E, 18P09K04G25P, 18P09K04L06K, 18P09K04L06M, 18P09K04L01C, 18P09K04H21X, 18P09K04H21C, 18P09K04H21Y, 18P09K04H21T, 18P09K04L06J, 18P09K04H22Q, 18P09K04H22F, 18P09K04K10R, 18P09K04K05L, 18P09K04K05H, 18P09K04G25C, 18P09K04G25T, 18P09K04L01A, 18P09K04H21F, 18P09K04L06N, 18P09K04L01Y, 18P09K04L01Z, 18P09K04L07K, 18P09K04L02Q, 18P09K04K10L, 18P09K04K10G, 18P09K04K10C, 18P09K04K05X, 18P09K04K05M, 18P09K04G25X, 18P09K04G25S, 18P09K04K10N, 18P09K04K05T, 18P09K04K10U, 18P09K04K10E, 18P09K04K05U, 18P09K04K05P, 18P09K04L01F, 18P09K04L01X, 18P09K04L01M, 18P09K04H21M, 18P09K04L06D, 18P09K04L01D, 18P09K04L06U, 18P09K04L01P, 18P09K04H21Z, 18P09K04L02A, 18P09K04G25L, 18P09K04K05I, 18P09K04K05D, 18P09K04G25Z, 18P09K04H21L, 18P09K04H21B, 18P09K04L01S, 18P09K04L01H, 18P09K04H21S, 18P09K04H21N, 18P09K04L07Q, 18P09K04H22V, 18P09K04H22K, 18P09K04K10S, 18P09K04K10H, 18P09K04K05W, 18P09K04G25R, 18P09K04G25N, 18P09K04G25U, 18P09K04L06A, 18P09K04L06G, 18P09K04H21W, 18P09K04L01N, 18P09K04L06E, 18P09K04L01J, 18P09K04L01E, 18P09K04H21P, 18P09K04L07F, 18P09K04L02V, 18P09K04L02F, 18P09K04K10M, 18P09K04G25M, 18P09K04G25G, 18P09K04G25H, 18P09K04G25Y, 18P09K04K05Z, 18P09K04L01Q, 18P09K04H21V, 18P09K04L06R, 18P09K04L06B, 18P09K04L01B, 18P09K04H21R, 18P09K04H21G, 18P09K04L06S, 18P09K04L06I, 18P09K04H21J, 18P09K04H21E, 18P09K04L02K"]
    },
     {
      NombreArea: "ODI-15111",
      Referencia: "18P09K04P02E",
      Celdas: ["18P09K04N05G, 18P09K04N05B, 18P09K04J25W, 18P09K04N05Z, 18P09K04P01V, 18P09K04P01R, 18P09K04P01M, 18P09K04P01H, 18P09K04P01T, 18P09K04P02S, 18P09K04P02I, 18P09K04P03C, 18P09K04P03T, 18P09K04K23Y, 18P09K04P04F, 18P09K04P04B, 18P09K04P04S, 18P09K04N05C, 18P09K04N05Y, 18P09K04N05D, 18P09K04J25Y, 18P09K04N05U, 18P09K04P01Q, 18P09K04N05P, 18P09K04N05E, 18P09K04K21W, 18P09K04K21X, 18P09K04P01Y, 18P09K04P02A, 18P09K04P02R, 18P09K04P02C, 18P09K04K22Y, 18P09K04P03B, 18P09K04P04A, 18P09K04K24W, 18P09K04P04D, 18P09K04K24Y, 18P09K04P04J, 18P09K04N05R, 18P09K04N05H, 18P09K04K21V, 18P09K04P01W, 18P09K04P01B, 18P09K04P01C, 18P09K04P01N, 18P09K04P01D, 18P09K04K21Y, 18P09K04P01P, 18P09K04P02Q, 18P09K04P02G, 18P09K04P02B, 18P09K04P02X, 18P09K04P02U, 18P09K04P02E, 18P09K04P03Q, 18P09K04P03N, 18P09K04P03J, 18P09K04P04E, 18P09K04K24Z, 18P09K04N05L, 18P09K04N05X, 18P09K04P01X, 18P09K04P01Z, 18P09K04P01U, 18P09K04K22X, 18P09K04P02T, 18P09K04P03V, 18P09K04P03R, 18P09K04P03H, 18P09K04K23X, 18P09K04P03Y, 18P09K04P04Q, 18P09K04P04R, 18P09K04P04G, 18P09K04P04M, 18P09K04P04Y, 18P09K04P04N, 18P09K04N05M, 18P09K04N05T, 18P09K04N05N, 18P09K04P01G, 18P09K04K22V, 18P09K04P02M, 18P09K04P02P, 18P09K04K22Z, 18P09K04P03W, 18P09K04P03U, 18P09K04K23Z, 18P09K04P04K, 18P09K04P04X, 18P09K04P04C, 18P09K04K24X, 18P09K04P04P, 18P09K04N05S, 18P09K04N05I, 18P09K04P01A, 18P09K04P02V, 18P09K04P02W, 18P09K04P02Y, 18P09K04P02D, 18P09K04P03K, 18P09K04P03L, 18P09K04P03G, 18P09K04P03S, 18P09K04P03D, 18P09K04P03Z, 18P09K04P03P, 18P09K04P04V, 18P09K04P04I, 18P09K04P01F, 18P09K04J25Z, 18P09K04P01S, 18P09K04P01I, 18P09K04P01J, 18P09K04P01E, 18P09K04K21Z, 18P09K04P02K, 18P09K04P02N, 18P09K04P02Z, 18P09K04K23V, 18P09K04K23W, 18P09K04P03M, 18P09K04K24V, 18P09K04P04W, 18P09K04P04L, 18P09K04P04H, 18P09K04P04Z, 18P09K04N05W, 18P09K04J25X, 18P09K04P01K, 18P09K04N05J, 18P09K04P01L, 18P09K04P02F, 18P09K04P02L, 18P09K04K22W, 18P09K04P02H, 18P09K04P02J, 18P09K04P03F, 18P09K04P03A, 18P09K04P03X, 18P09K04P03I, 18P09K04P03E, 18P09K04P04T, 18P09K04P04U"]
    },
     {
      NombreArea: "511368",
      Referencia: "18P09K04C16E",
      Celdas: ["18P09K04C16E, 18P09K04C11J, 18P09K04C17A, 18P09K04C12Q, 18P09K04C12K, 18P09K04C12R, 18P09K04C12G, 18P09K04C07R, 18P09K04C07G, 18P09K04C12H, 18P09K04C12C, 18P09K04C07H, 18P09K04C07N, 18P09K04C11U, 18P09K04C12F, 18P09K04C12L, 18P09K04C12B, 18P09K04C17H, 18P09K04C07X, 18P09K04C12I, 18P09K04C07Y, 18P09K04C17J, 18P09K04C07Z, 18P09K04C11E, 18P09K04C17F, 18P09K04C12A, 18P09K04C17B, 18P09K04C12D, 18P09K04C07T, 18P09K04C12J, 18P09K04C07P, 18P09K04C07F, 18P09K04C12W, 18P09K04C07M, 18P09K04C17I, 18P09K04C12U, 18P09K04C07U, 18P09K04C12V, 18P09K04C17G, 18P09K04C07W, 18P09K04C17C, 18P09K04C12M, 18P09K04C07S, 18P09K04C12Z, 18P09K04C07J, 18P09K04C11Z, 18P09K04C11P, 18P09K04C06U, 18P09K04C07V, 18P09K04C07Q, 18P09K04C16J, 18P09K04C06Z, 18P09K04C06P, 18P09K04C06J, 18P09K04C12X, 18P09K04C17D, 18P09K04C12Y, 18P09K04C12T, 18P09K04C17E, 18P09K04C12P, 18P09K04C07K, 18P09K04C07L, 18P09K04C12S, 18P09K04C12N, 18P09K04C07I, 18P09K04C12E"]
    },
     {
      NombreArea: "511367",
      Referencia: "18P09K04C16D",
      Celdas: ["18P09K04B10N, 18P09K04B20E, 18P09K04C06V, 18P09K04C11S, 18P09K04C11T, 18P09K04C11D, 18P09K04C06N, 18P09K04B10T, 18P09K04C06F, 18P09K04C06G, 18P09K04C16D, 18P09K04C06T, 18P09K04B15N, 18P09K04C11K, 18P09K04B10Z, 18P09K04C06K, 18P09K04C16B, 18P09K04C11R, 18P09K04C06W, 18P09K04C16C, 18P09K04C06X, 18P09K04B10Y, 18P09K04B15E, 18P09K04C06Q, 18P09K04B10J, 18P09K04C11G, 18P09K04C11B, 18P09K04C06S, 18P09K04C11Y, 18P09K04C11N, 18P09K04C06I, 18P09K04B20I, 18P09K04B20D, 18P09K04B15T, 18P09K04B15Z, 18P09K04C11Q, 18P09K04C11A, 18P09K04C11W, 18P09K04C11L, 18P09K04C06L, 18P09K04C11M, 18P09K04C11I, 18P09K04B15I, 18P09K04B10I, 18P09K04B20J, 18P09K04B10P, 18P09K04C06M, 18P09K04C16I, 18P09K04B15Y, 18P09K04C16F, 18P09K04C11V, 18P09K04B15U, 18P09K04C11F, 18P09K04B10U, 18P09K04C11X, 18P09K04B15D, 18P09K04C16A, 18P09K04B15P, 18P09K04B15J, 18P09K04C16G, 18P09K04C06R, 18P09K04C16H, 18P09K04C11H, 18P09K04C11C, 18P09K04C06H, 18P09K04C06Y"]
    },
    {
      NombreArea: "OAA-08491",
      Referencia: "18P09K04I12Z",
      Celdas: ["18P09K04I12Z, 18P09K04I18L, 18P09K04I13G, 18P09K04I18N, 18P09K04I18D, 18P09K04I24C, 18P09K04I14G, 18P09K04I19U, 18P09K04I14P, 18P09K04I20V, 18P09K04I20K, 18P09K04I20F, 18P09K04I15W, 18P09K04I15G, 18P09K04I20H, 18P09K04I20C, 18P09K04I17U, 18P09K04I23A, 18P09K04I13F, 18P09K04I18W, 18P09K04I13I, 18P09K04I18E, 18P09K04I19A, 18P09K04I14F, 18P09K04I14X, 18P09K04I14S, 18P09K04I25A, 18P09K04I20Q, 18P09K04I25B, 18P09K04I20G, 18P09K04I15L, 18P09K04I20X, 18P09K04I17P, 18P09K04I18A, 18P09K04I18B, 18P09K04I13H, 18P09K04I23D, 18P09K04I18I, 18P09K04I18U, 18P09K04I18P, 18P09K04I13P, 18P09K04I19V, 18P09K04I14V, 18P09K04I19R, 18P09K04I19N, 18P09K04I24J, 18P09K04I20S, 18P09K04I15H, 18P09K04I18C, 18P09K04I19W, 18P09K04I19S, 18P09K04I19C, 18P09K04I14L, 18P09K04I14M, 18P09K04I14I, 18P09K04I19Z, 18P09K04I17E, 18P09K04I12P, 18P09K04I18F, 18P09K04I13Q, 18P09K04I18G, 18P09K04I13W, 18P09K04I13L, 18P09K04I18M, 18P09K04I13X, 18P09K04I13J, 18P09K04I14Q, 18P09K04I24B, 18P09K04I19X, 18P09K04I19B, 18P09K04I14W, 18P09K04I19D, 18P09K04I14T, 18P09K04I24E, 18P09K04I19P, 18P09K04I14Z, 18P09K04I14U, 18P09K04I15V, 18P09K04I20B, 18P09K04I15S, 18P09K04I22E, 18P09K04I18Q, 18P09K04I18K, 18P09K04I13V, 18P09K04I13K, 18P09K04I23C, 18P09K04I18Y, 18P09K04I18T, 18P09K04I13Z, 18P09K04I19K, 18P09K04I19F, 18P09K04I19G, 18P09K04I24D, 18P09K04I19I, 18P09K04I14N, 18P09K04I19E, 18P09K04I14J, 18P09K04I20A, 18P09K04I15F, 18P09K04I20W, 18P09K04I20R, 18P09K04I20L, 18P09K04I17Z, 18P09K04I12J, 18P09K04I23B, 18P09K04I18R, 18P09K04I13R, 18P09K04I18X, 18P09K04I13S, 18P09K04I13Y, 18P09K04I23E, 18P09K04I13U, 18P09K04I19Q, 18P09K04I14K, 18P09K04I14H, 18P09K04I14Y, 18P09K04I19J, 18P09K04I15Q, 18P09K04I15K, 18P09K04I20M, 18P09K04I15X, 18P09K04I15M, 18P09K04I17J, 18P09K04I12U, 18P09K04I18V, 18P09K04I18S, 18P09K04I18H, 18P09K04I13M, 18P09K04I13T, 18P09K04I13N, 18P09K04I18Z, 18P09K04I18J, 18P09K04I24A, 18P09K04I19L, 18P09K04I19M, 18P09K04I19H, 18P09K04I14R, 18P09K04I19Y, 18P09K04I19T, 18P09K04I15R, 18P09K04I25C"]
    }
    , {
      NombreArea: "OEA-10073",
      Referencia: "18P09K04G04J",
      Celdas: ["18P09K04G03Y, 18P09K04G03Z, 18P09K04G03I, 18P09K04G04X, 18P09K04G04D, 18P09K04G05Q, 18P09K04G05F, 18P09K04G05A, 18P09K04G05W, 18P09K04G05M, 18P09K04H01F, 18P09K04H01W, 18P09K04H01M, 18P09K04H01C, 18P09K04D21Z, 18P09K04H02F, 18P09K04G08E, 18P09K04G09A, 18P09K04G04G, 18P09K04G09C, 18P09K04G04M, 18P09K04G09D, 18P09K04G04N, 18P09K04G05X, 18P09K04G05R, 18P09K04G05T, 18P09K04C25Z, 18P09K04H06D, 18P09K04H01P, 18P09K04G03T, 18P09K04G03U, 18P09K04G04K, 18P09K04C24V, 18P09K04G04L, 18P09K04G04Y, 18P09K04G10A, 18P09K04C25W, 18P09K04C25X, 18P09K04H01B, 18P09K04D21W, 18P09K04H01X, 18P09K04H01T, 18P09K04H01I, 18P09K04H01D, 18P09K04H06E, 18P09K04H01U, 18P09K04H07A, 18P09K04C23Z, 18P09K04G04V, 18P09K04G04B, 18P09K04G04U, 18P09K04C24Z, 18P09K04G05K, 18P09K04C25V, 18P09K04G05S, 18P09K04G05H, 18P09K04G05C, 18P09K04C25Y, 18P09K04G05U, 18P09K04H01Q, 18P09K04H01K, 18P09K04H01S, 18P09K04H02A, 18P09K04D22V, 18P09K04G03P, 18P09K04G04F, 18P09K04G09B, 18P09K04G04H, 18P09K04G04P, 18P09K04G05V, 18P09K04G10C, 18P09K04G10D, 18P09K04G05Y, 18P09K04G05N, 18P09K04G05Z, 18P09K04H01R, 18P09K04H01Y, 18P09K04H01N, 18P09K04H01E, 18P09K04G03N, 18P09K04G03D, 18P09K04G03E, 18P09K04G04A, 18P09K04G04W, 18P09K04C24W, 18P09K04G04C, 18P09K04C24Y, 18P09K04G04Z, 18P09K04G10B, 18P09K04G05L, 18P09K04G05G, 18P09K04G10E, 18P09K04H01A, 18P09K04D21V, 18P09K04H06B, 18P09K04H06C, 18P09K04H01J, 18P09K04H02K, 18P09K04G04R, 18P09K04G04S, 18P09K04G09E, 18P09K04G04J, 18P09K04G04E, 18P09K04G05P, 18P09K04G05E, 18P09K04H01H, 18P09K04H02Q, 18P09K04G08D, 18P09K04G03J, 18P09K04C23Y, 18P09K04G04Q, 18P09K04C24X, 18P09K04G04T, 18P09K04G04I, 18P09K04G05B, 18P09K04G05I, 18P09K04G05D, 18P09K04G05J, 18P09K04H06A, 18P09K04H01V, 18P09K04H01L, 18P09K04H01G, 18P09K04D21X, 18P09K04D21Y, 18P09K04H01Z, 18P09K04H02V"]
    }  
   
   , {
      NombreArea: "503304",
      Referencia: "18P09K17M11X",
      Celdas: ["18P09K17M11X, 18P09K17M11N, 18P09K17M12S, 18P09K17M12I, 18P09K17M13Q, 18P09K17M08V, 18P09K17M13L, 18P09K17M08W, 18P09K17M13M, 18P09K17M13N, 18P09K17M13E, 18P09K17M14L, 18P09K17M14H, 18P09K17M09X, 18P09K17M11S, 18P09K17M12F, 18P09K17M12D, 18P09K17M09S, 18P09K17M11W, 18P09K17M11P, 18P09K17M12V, 18P09K17M12G, 18P09K17M12U, 18P09K17M12P, 18P09K17M13A, 18P09K17M13B, 18P09K17M13I, 18P09K17M13P, 18P09K17M08Z, 18P09K17M09R, 18P09K17M11H, 18P09K17M11I, 18P09K17M12Q, 18P09K17M12K, 18P09K17M12L, 18P09K17M12C, 18P09K17M12E, 18P09K17M14B, 18P09K17M09W, 18P09K17M11M, 18P09K17M11Y, 18P09K17M12A, 18P09K17M12B, 18P09K17M07Z, 18P09K17M13G, 18P09K17M13H, 18P09K17M13C, 18P09K17M14F, 18P09K17M09Q, 18P09K17M14M, 18P09K17M11L, 18P09K17M11G, 18P09K17M11J, 18P09K17M12W, 18P09K17M12M, 18P09K17M13F, 18P09K17M08X, 18P09K17M11U, 18P09K17M11E, 18P09K17M12R, 18P09K17M12N, 18P09K17M12H, 18P09K17M13D, 18P09K17M14A, 18P09K17M14C, 18P09K17M11R, 18P09K17M11T, 18P09K17M11Z, 18P09K17M12T, 18P09K17M12J, 18P09K17M13K, 18P09K17M13R, 18P09K17M13S, 18P09K17M08Y, 18P09K17M13J, 18P09K17M14K, 18P09K17M09V, 18P09K17M14G"]
    }, {
      NombreArea: "503307",
      Referencia: "18P09P01E03H",
      Celdas: ["18P09P01E03H, 18P09P01A08T, 18P09P01A08I, 18P09P01E04Q, 18P09P01A24Q, 18P09P01A24K, 18P09P01E04R, 18P09P01A24R, 18P09P01A09G, 18P09P01E09H, 18P09P01E09N, 18P09P01E04T, 18P09P01E09Z, 18P09P01E05V, 18P09P01E04J, 18P09P01A24U, 18P09P01A24P, 18P09P01A25Q, 18P09P01A09U, 18P09P01E10R, 18P09P01A10G, 18P09P01E15X, 18P09P01E10H, 18P09P01A10H, 18P09P01E20I, 18P09P01E15D, 18P09P01E05I, 18P09P01A25N, 18P09P01E20U, 18P09P01E05E, 18P09P01A25P, 18P09P01F11V, 18P09P01F16W, 18P09P01F21H, 18P09P01F16C, 18P09P01F06S, 18P09P01F01C, 18P09P01B21X, 18P09P01F21D, 18P09P01F06D, 18P09P01B21N, 18P09P01F21E, 18P09P01F16Z, 18P09P01F16U, 18P09P01F01Z, 18P09P01F01U, 18P09P01B21U, 18P09P01F22F, 18P09P01F22A, 18P09P01F07K, 18P09P01F07L, 18P09P01B22W, 18P09P01B07I, 18P09P01B22Z, 18P09P01B23T, 18P09P01B18N, 18P09P01B23J, 18P09P01E02E, 18P09P01E03A, 18P09P01A08S, 18P09P01A08M, 18P09P01E03D, 18P09P01E03P, 18P09P01A23Z, 18P09P01A23U, 18P09P01E04F, 18P09P01A24X, 18P09P01A09T, 18P09P01A09I, 18P09P01E05Q, 18P09P01E05K, 18P09P01E04E, 18P09P01A25K, 18P09P01A09J, 18P09P01E15L, 18P09P01E10W, 18P09P01A25L, 18P09P01E15S, 18P09P01E15H, 18P09P01E10X, 18P09P01E05S, 18P09P01E20N, 18P09P01E15Y, 18P09P01E25E, 18P09P01E20J, 18P09P01F21F, 18P09P01F11F, 18P09P01F06K, 18P09P01F16G, 18P09P01F11R, 18P09P01F16M, 18P09P01F16H, 18P09P01F11C, 18P09P01F06M, 18P09P01B21S, 18P09P01F11I, 18P09P01F06I, 18P09P01F11P, 18P09P01F11E, 18P09P01F06J, 18P09P01F01E, 18P09P01F12L, 18P09P01F07Q, 18P09P01B22L, 18P09P01F07C, 18P09P01F02U, 18P09P01B07P, 18P09P01F03F, 18P09P01B08K, 18P09P01B08F, 18P09P01B23W, 18P09P01A08R, 18P09P01A09V, 18P09P01A09K, 18P09P01E04H, 18P09P01E04C, 18P09P01A24S, 18P09P01A09M, 18P09P01A09H, 18P09P01E04N, 18P09P01E04I, 18P09P01E14P, 18P09P01E14E, 18P09P01A25V, 18P09P01E15G, 18P09P01E15B, 18P09P01E15C, 18P09P01E10S, 18P09P01A25S, 18P09P01E20Y, 18P09P01E10I, 18P09P01E20Z, 18P09P01E05Z, 18P09P01A25U, 18P09P01F16F, 18P09P01F16A, 18P09P01F06A, 18P09P01F01V, 18P09P01F01Q, 18P09P01F01A, 18P09P01F21B, 18P09P01F16R, 18P09P01F16B, 18P09P01F11W, 18P09P01F11B, 18P09P01F06G, 18P09P01F01H, 18P09P01F16Y, 18P09P01F16N, 18P09P01F11T, 18P09P01B21T, 18P09P01F16J, 18P09P01F16E, 18P09P01F11J, 18P09P01F06U, 18P09P01F17F, 18P09P01F02V, 18P09P01F02K, 18P09P01F02A, 18P09P01F02B, 18P09P01B22R, 18P09P01F07S, 18P09P01F02M, 18P09P01F02C, 18P09P01F07D, 18P09P01F02Y, 18P09P01F02D, 18P09P01F07E, 18P09P01B22U, 18P09P01B07J, 18P09P01F03G, 18P09P01F03B, 18P09P01B23G, 18P09P01B23X, 18P09P01B23M, 18P09P01B13T, 18P09P01B08T, 18P09P01B23E, 18P09P01E04L, 18P09P01A09L, 18P09P01E09C, 18P09P01E04M, 18P09P01A24M, 18P09P01E15A, 18P09P01E10V, 18P09P01E10Q, 18P09P01E10A, 18P09P01E04P, 18P09P01A09P, 18P09P01E05G, 18P09P01A25W, 18P09P01A10R, 18P09P01A10L, 18P09P01E20S, 18P09P01E05X, 18P09P01E15I, 18P09P01A25Y, 18P09P01E15J, 18P09P01E10Z, 18P09P01E10U, 18P09P01F11A, 18P09P01F06Q, 18P09P01F01K, 18P09P01B21V, 18P09P01F11L, 18P09P01F06L, 18P09P01B21L, 18P09P01F11H, 18P09P01F06H, 18P09P01F01S, 18P09P01F01D, 18P09P01F11U, 18P09P01B21P, 18P09P01F12Q, 18P09P01F12F, 18P09P01F07W, 18P09P01F07G, 18P09P01F07A, 18P09P01F02Q, 18P09P01F02G, 18P09P01F02X, 18P09P01F02H, 18P09P01B22X, 18P09P01B22T, 18P09P01B22N, 18P09P01F07J, 18P09P01B22P, 18P09P01B23L, 18P09P01B08L, 18P09P01B23S, 18P09P01B08M, 18P09P01B23I, 18P09P01B18T, 18P09P01B13N, 18P09P01B19V, 18P09P01A08H, 18P09P01A08Y, 18P09P01A08U, 18P09P01E09B, 18P09P01E04B, 18P09P01A24Y, 18P09P01A24N, 18P09P01E10K, 18P09P01E04Z, 18P09P01E10G, 18P09P01E05B, 18P09P01A25X, 18P09P01A25M, 18P09P01E10Y, 18P09P01E10T, 18P09P01E10D, 18P09P01A25T, 18P09P01A10I, 18P09P01E15Z, 18P09P01E15E, 18P09P01E10J, 18P09P01F11K, 18P09P01F11G, 18P09P01F06W, 18P09P01F01W, 18P09P01F01L, 18P09P01B06G, 18P09P01F21C, 18P09P01F16S, 18P09P01F11X, 18P09P01F11S, 18P09P01F06X, 18P09P01F01X, 18P09P01F01M, 18P09P01F21I, 18P09P01F01N, 18P09P01F01I, 18P09P01F21J, 18P09P01F16P, 18P09P01F06Z, 18P09P01F06P, 18P09P01F01J, 18P09P01F12V, 18P09P01F12A, 18P09P01F07F, 18P09P01F02W, 18P09P01F02R, 18P09P01B22Q, 18P09P01B22K, 18P09P01B07G, 18P09P01F07M, 18P09P01B07H, 18P09P01F03K, 18P09P01B08G, 18P09P01B23H, 18P09P01B23C, 18P09P01B08H, 18P09P01B18D, 18P09P01B08Y, 18P09P01B23P, 18P09P01B24A, 18P09P01E03B, 18P09P01A08L, 18P09P01A08G, 18P09P01E03U, 18P09P01A08Z, 18P09P01A08P, 18P09P01A08J, 18P09P01E04V, 18P09P01A09F, 18P09P01E04W, 18P09P01A24W, 18P09P01A24L, 18P09P01A09R, 18P09P01A09S, 18P09P01E09D, 18P09P01E04D, 18P09P01A24T, 18P09P01E15K, 18P09P01E14J, 18P09P01E09U, 18P09P01E10F, 18P09P01E05F, 18P09P01A10Q, 18P09P01A10K, 18P09P01E15R, 18P09P01E10L, 18P09P01E10B, 18P09P01E05R, 18P09P01E20X, 18P09P01E20C, 18P09P01E10C, 18P09P01E05M, 18P09P01E05C, 18P09P01E05Y, 18P09P01E05D, 18P09P01E20E, 18P09P01E10E, 18P09P01E05U, 18P09P01A25Z, 18P09P01A10J, 18P09P01B21Q, 18P09P01B06F, 18P09P01F11M, 18P09P01B06H, 18P09P01F16D, 18P09P01F06Y, 18P09P01F06N, 18P09P01B06I, 18P09P01F06E, 18P09P01F17Q, 18P09P01F12G, 18P09P01F12B, 18P09P01F02L, 18P09P01B07F, 18P09P01F07I, 18P09P01F02T, 18P09P01F02P, 18P09P01B23R, 18P09P01B08R, 18P09P01B08S, 18P09P01B18I, 18P09P01B08I, 18P09P01E03G, 18P09P01E03I, 18P09P01A08N, 18P09P01E03J, 18P09P01E03E, 18P09P01E04A, 18P09P01A24V, 18P09P01E04X, 18P09P01E04S, 18P09P01E09I, 18P09P01E04Y, 18P09P01E09E, 18P09P01E04U, 18P09P01E05A, 18P09P01A25R, 18P09P01E20M, 18P09P01E20H, 18P09P01E20T, 18P09P01E20D, 18P09P01E15T, 18P09P01E05T, 18P09P01E20P, 18P09P01E10P, 18P09P01E05P, 18P09P01E05J, 18P09P01F16V, 18P09P01F16Q, 18P09P01B21K, 18P09P01F16L, 18P09P01F06R, 18P09P01F06B, 18P09P01F01R, 18P09P01F01B, 18P09P01B21W, 18P09P01F16X, 18P09P01B21M, 18P09P01F16T, 18P09P01F11N, 18P09P01F01Y, 18P09P01F01T, 18P09P01F01P, 18P09P01B21Z, 18P09P01F07R, 18P09P01F07B, 18P09P01F02F, 18P09P01B22V, 18P09P01B22M, 18P09P01F02N, 18P09P01F02I, 18P09P01B22Y, 18P09P01F02E, 18P09P01F03A, 18P09P01B23V, 18P09P01B23K, 18P09P01F03C, 18P09P01B23Y, 18P09P01B08N, 18P09P01E03C, 18P09P01E03Z, 18P09P01A23P, 18P09P01E04K, 18P09P01A09Q, 18P09P01E04G, 18P09P01A09N, 18P09P01E15F, 18P09P01E09P, 18P09P01E09J, 18P09P01A24Z, 18P09P01A10F, 18P09P01E05W, 18P09P01E05L, 18P09P01E25C, 18P09P01E15M, 18P09P01E10M, 18P09P01E05H, 18P09P01E25D, 18P09P01E15N, 18P09P01E10N, 18P09P01E05N, 18P09P01E15U, 18P09P01E15P, 18P09P01F21A, 18P09P01F16K, 18P09P01F11Q, 18P09P01F06V, 18P09P01F06F, 18P09P01F01F, 18P09P01F21G, 18P09P01F01G, 18P09P01B21R, 18P09P01F06C, 18P09P01F16I, 18P09P01F11Y, 18P09P01F11D, 18P09P01F06T, 18P09P01B21Y, 18P09P01F11Z, 18P09P01B06J, 18P09P01F17V, 18P09P01F17K, 18P09P01F17A, 18P09P01F12K, 18P09P01F07V, 18P09P01F07H, 18P09P01F02S, 18P09P01B22S, 18P09P01F07N, 18P09P01F02J, 18P09P01B23Q, 18P09P01B18X, 18P09P01B23N, 18P09P01B23D, 18P09P01B18Y, 18P09P01B13Y, 18P09P01B13I, 18P09P01B13D, 18P09P01B18Z"]
    }, {
      NombreArea: "503310",
      Referencia: "18P09K21D04S",
      Celdas: ["18P09K21D04S, 18P09K16Q24S, 18P09K21D14I, 18P09K21D09T, 18P09K21D04D, 18P09K21D04G, 18P09K21D09C, 18P09K16Q24H, 18P09K21D19I, 18P09K21D14Y, 18P09K21D09Y, 18P09K21D09N, 18P09K21D04T, 18P09K16Q24G, 18P09K21D04C, 18P09K21D04I, 18P09K16Q24Y, 18P09K16Q24N, 18P09K16Q24D, 18P09K21D04B, 18P09K21D19D, 18P09K16Q24R, 18P09K21D09M, 18P09K21D09H, 18P09K21D04H, 18P09K16Q24M, 18P09K16Q24C, 18P09K21D14D, 18P09K16Q24L, 18P09K21D04X, 18P09K21D04M, 18P09K21D14T, 18P09K21D14N, 18P09K16Q24T, 18P09K16Q24I, 18P09K16Q24W, 18P09K16Q24X, 18P09K21D04N"]
    }, {
      NombreArea: "503311",
      Referencia: "18P09K21P04R",
      Celdas: ["18P09K21P04R, 18P09K21P04F, 18P09K21P04X, 18P09K21P04Z, 18P09K21P04U, 18P09K21P05X, 18P09K21P05M, 18P09K21P05N, 18P09K21Q01M, 18P09K21P04M, 18P09K21P04Y, 18P09K21P05V, 18P09K21P05Q, 18P09K21P05K, 18P09K21Q01W, 18P09K21P04V, 18P09K21P04W, 18P09K21P04H, 18P09K21P04T, 18P09K21P05F, 18P09K21P05S, 18P09K21P05J, 18P09K21Q01R, 18P09K21Q01L, 18P09K21Q01H, 18P09K21P04Q, 18P09K21P04J, 18P09K21P05W, 18P09K21P05G, 18P09K21P05H, 18P09K21P05U, 18P09K21P04G, 18P09K21P04I, 18P09K21Q01G, 18P09K21P04K, 18P09K21P04L, 18P09K21P04S, 18P09K21P04N, 18P09K21P04P, 18P09K21P05L, 18P09K21Q01K, 18P09K21Q01X, 18P09K21P05T, 18P09K21P05I, 18P09K21Q01V, 18P09K21P05P, 18P09K21Q01S, 18P09K21P05R, 18P09K21P05Y, 18P09K21P05Z, 18P09K21Q01Q, 18P09K21Q01F"]
    }, {
      NombreArea: "503931",
      Referencia: "18P09J25Q06F",
      Celdas: ["18P09J25Q06F, 18P09J25L16W, 18P09J25Q06M, 18P09J25Q01X, 18P09J25Q01S, 18P09J25L21S, 18P09J25Q11D, 18P09J25Q06N, 18P09J25L16I, 18P09J25Q11J, 18P09J25L16Z, 18P09J25L11Z, 18P09J25L22Q, 18P09J25L22K, 18P09J25L12Q, 18P09J25Q07B, 18P09J25L22G, 18P09J25L17W, 18P09J25L12R, 18P09J25L12G, 18P09J25Q12H, 18P09J25Q12C, 18P09J25Q07H, 18P09J25Q02M, 18P09J25L17H, 18P09J25L12H, 18P09J25L12C, 18P09J25Q12Y, 18P09J25Q12N, 18P09J25Q07E, 18P09J25Q02Z, 18P09J25L12J, 18P09J25Q13K, 18P09J25Q08Q, 18P09J25L18Q, 18P09J25Q11C, 18P09J25Q06H, 18P09J25Q06C, 18P09J25L21M, 18P09J25Q06D, 18P09J25L21Z, 18P09J25L16E, 18P09J25Q07Q, 18P09J25Q07F, 18P09J25L22A, 18P09J25Q02W, 18P09J25Q02R, 18P09J25Q02L, 18P09J25Q02G, 18P09J25L22L, 18P09J25L07S, 18P09J25Q12I, 18P09J25Q07N, 18P09J25Q02T, 18P09J25Q12U, 18P09J25Q07Z, 18P09J25Q07U, 18P09J25L22J, 18P09J25L17E, 18P09J25L12P, 18P09J25Q08A, 18P09J25L23F, 18P09J25L13F, 18P09J25P10Z, 18P09J25Q06B, 18P09J25L21F, 18P09J25Q06X, 18P09J25Q06S, 18P09J25Q06T, 18P09J25Q06I, 18P09J25Q06Z, 18P09J25Q12K, 18P09J25Q07V, 18P09J25Q02F, 18P09J25L22V, 18P09J25L12K, 18P09J25Q12R, 18P09J25Q12G, 18P09J25Q12B, 18P09J25Q07R, 18P09J25Q07L, 18P09J25Q02B, 18P09J25L22B, 18P09J25L17R, 18P09J25Q12M, 18P09J25Q07M, 18P09J25Q12D, 18P09J25Q12E, 18P09J25L22U, 18P09J25L13Q, 18P09J25L13K, 18P09J25Q11B, 18P09J25Q06K, 18P09J25Q06L, 18P09J25L21C, 18P09J25L16X, 18P09J25Q11I, 18P09J25L16T, 18P09J25Q06J, 18P09J25Q06E, 18P09J25L21U, 18P09J25L21E, 18P09J25Q02K, 18P09J25L22F, 18P09J25L17Q, 18P09J25L22W, 18P09J25L17L, 18P09J25L17S, 18P09J25L22I, 18P09J25L17I, 18P09J25Q12P, 18P09J25Q02P, 18P09J25L12E, 18P09J25L07Z, 18P09J25L23V, 18P09J25L13V, 18P09J25P10T, 18P09J25P10U, 18P09J25K25P, 18P09J25Q06Q, 18P09J25Q06R, 18P09J25Q11H, 18P09J25L21H, 18P09J25L16S, 18P09J25L16M, 18P09J25Q01Y, 18P09J25L16Y, 18P09J25Q11P, 18P09J25Q06U, 18P09J25Q01U, 18P09J25L16U, 18P09J25L16P, 18P09J25Q12F, 18P09J25Q02A, 18P09J25Q07W, 18P09J25Q07G, 18P09J25L22R, 18P09J25L12W, 18P09J25L07W, 18P09J25Q07X, 18P09J25Q02H, 18P09J25L22X, 18P09J25L12X, 18P09J25L12S, 18P09J25L07X, 18P09J25Q07T, 18P09J25Q02I, 18P09J25Q02D, 18P09J25L22T, 18P09J25Q07P, 18P09J25L17Z, 18P09J25L12Z, 18P09J25Q13Q, 18P09J25Q13F, 18P09J25Q08F, 18P09J25Q03K, 18P09J25Q06W, 18P09J25L21G, 18P09J25L21B, 18P09J25Q12A, 18P09J25Q07K, 18P09J25Q07A, 18P09J25L12F, 18P09J25L12L, 18P09J25L07R, 18P09J25Q12X, 18P09J25Q12S, 18P09J25Q07C, 18P09J25Q02S, 18P09J25L22S, 18P09J25L17M, 18P09J25L17C, 18P09J25L12M, 18P09J25Q07Y, 18P09J25Q07I, 18P09J25Q02Y, 18P09J25Q02N, 18P09J25L17D, 18P09J25L12Y, 18P09J25L12T, 18P09J25L12D, 18P09J25L07Y, 18P09J25Q02U, 18P09J25Q02J, 18P09J25Q02E, 18P09J25L22P, 18P09J25L12U, 18P09J25Q03F, 18P09J25L18V, 18P09J25L13A, 18P09J25Q06V, 18P09J25L21K, 18P09J25Q01N, 18P09J25L16D, 18P09J25Q11E, 18P09J25Q06P, 18P09J25Q01Z, 18P09J25Q01P, 18P09J25L11U, 18P09J25Q02V, 18P09J25Q02Q, 18P09J25L17K, 18P09J25L17F, 18P09J25L17A, 18P09J25L12V, 18P09J25Q12L, 18P09J25L12B, 18P09J25Q07S, 18P09J25Q02X, 18P09J25Q07D, 18P09J25L12N, 18P09J25L12I, 18P09J25Q17E, 18P09J25Q12Z, 18P09J25Q12J, 18P09J25Q07J, 18P09J25Q18A, 18P09J25Q13V, 18P09J25Q13A, 18P09J25Q08V, 18P09J25Q08K, 18P09J25Q03Q, 18P09J25L23Q, 18P09J25L23K, 18P09J25L23A, 18P09J25P10P, 18P09J25Q06G, 18P09J25L21L, 18P09J25Q06Y, 18P09J25Q01T, 18P09J25L21T, 18P09J25L21N, 18P09J25L21I, 18P09J25L21D, 18P09J25L16N, 18P09J25Q01J, 18P09J25L21P, 18P09J25L21J, 18P09J25L16J, 18P09J25L17V, 18P09J25L17G, 18P09J25L17B, 18P09J25Q02C, 18P09J25L22M, 18P09J25Q12T, 18P09J25L22Y, 18P09J25L22N, 18P09J25L22Z, 18P09J25L22E, 18P09J25Q03V, 18P09J25Q03A"]
    }, {
      NombreArea: "503932",
      Referencia: "18P09K21P19D",
      Celdas: ["18P09K21P19D, 18P09K21P14U, 18P09K21P09Z, 18P09K21P09E, 18P09K21P20R, 18P09K21P10S, 18P09K21P20I, 18P09K21P15I, 18P09K21Q16Q, 18P09K21P10P, 18P09K21Q06K, 18P09K21P19Y, 18P09K21P19I, 18P09K21P14Y, 18P09K21P15W, 18P09K21P15M, 18P09K21P20D, 18P09K21P15N, 18P09K21P10Y, 18P09K21P10I, 18P09K21P10D, 18P09K21Q11Q, 18P09K21Q06V, 18P09K21P19T, 18P09K21P20F, 18P09K21P15V, 18P09K21P20L, 18P09K21P20B, 18P09K21P10R, 18P09K21P10C, 18P09K21P15Z, 18P09K21P15U, 18P09K21P10E, 18P09K21Q06A, 18P09K21P24D, 18P09K21P14T, 18P09K21P14N, 18P09K21P09Y, 18P09K21P20A, 18P09K21P15Q, 18P09K21P10A, 18P09K21P15H, 18P09K21Q16K, 18P09K21P20J, 18P09K21Q11V, 18P09K21P10Z, 18P09K21P14I, 18P09K21P19P, 18P09K21P19J, 18P09K21P14P, 18P09K21P20Q, 18P09K21P20K, 18P09K21P20G, 18P09K21P15R, 18P09K21P15G, 18P09K21P10G, 18P09K21P20M, 18P09K21P10H, 18P09K21P20N, 18P09K21P15T, 18P09K21P15D, 18P09K21P10N, 18P09K21P20U, 18P09K21Q16A, 18P09K21P15P, 18P09K21P10J, 18P09K21P19N, 18P09K21P09T, 18P09K21P09I, 18P09K21P19E, 18P09K21P14Z, 18P09K21P14J, 18P09K21P14E, 18P09K21P09U, 18P09K21P10F, 18P09K21P15X, 18P09K21P15Y, 18P09K21Q11K, 18P09K21Q06F, 18P09K21P09N, 18P09K21P19Z, 18P09K21P19U, 18P09K21P09P, 18P09K21P09J, 18P09K21P15K, 18P09K21P10V, 18P09K21P10Q, 18P09K21P10K, 18P09K21P15L, 18P09K21P15B, 18P09K21P10B, 18P09K21P10X, 18P09K21P10T, 18P09K21Q16F, 18P09K21P15J, 18P09K21P15E, 18P09K21Q11A, 18P09K21Q06Q, 18P09K21P14D, 18P09K21P09D, 18P09K21P15F, 18P09K21P15A, 18P09K21P10W, 18P09K21P10L, 18P09K21P20H, 18P09K21P20C, 18P09K21P15S, 18P09K21P15C, 18P09K21P10M, 18P09K21P20P, 18P09K21P20E, 18P09K21Q11F, 18P09K21P10U"]
    }, {
      NombreArea: "504150",
      Referencia: "18P09K17M06B",
      Celdas: ["18P09K17M06B, 18P09K17M01B, 18P09K17M06J, 18P09K17M01U, 18P09K17M07A, 18P09K17M02V, 18P09K17M02D, 18P09K17I22T, 18P09K17M07P, 18P09K17M02Z, 18P09K17I22Z, 18P09K17M08Q, 18P09K17M03V, 18P09K17M03M, 18P09K17M03N, 18P09K17M08J, 18P09K17M09L, 18P09K17M09H, 18P09K17M09C, 18P09K17M14I, 18P09K17M09E, 18P09K17M04I, 18P09K17M10V, 18P09K17M10B, 18P09K17M05B, 18P09K17M01W, 18P09K17I21W, 18P09K17I21L, 18P09K17M06S, 18P09K17I21S, 18P09K17M06T, 18P09K17I21Y, 18P09K17M01J, 18P09K17I21U, 18P09K17M02F, 18P09K17I22K, 18P09K17M02W, 18P09K17M07Y, 18P09K17M07M, 18P09K17M02X, 18P09K17M07D, 18P09K17M02T, 18P09K17M02H, 18P09K17M02C, 18P09K17M07U, 18P09K17M07E, 18P09K17M02J, 18P09K17M08F, 18P09K17M08A, 18P09K17M03Q, 18P09K17M03B, 18P09K17M08H, 18P09K17M08C, 18P09K17M03X, 18P09K17M08I, 18P09K17M08D, 18P09K17I23Y, 18P09K17M03J, 18P09K17M09G, 18P09K17M04G, 18P09K17M09M, 18P09K17M14J, 18P09K17M14D, 18P09K17M09P, 18P09K17M09D, 18P09K17M04Y, 18P09K17M04Z, 18P09K17M04P, 18P09K17M10G, 18P09K17M06G, 18P09K17M06X, 18P09K17M06C, 18P09K17M01S, 18P09K17M01H, 18P09K17M06I, 18P09K17I21N, 18P09K17M01Z, 18P09K17M07V, 18P09K17M07F, 18P09K17I22R, 18P09K17M07T, 18P09K17M07C, 18P09K17I22M, 18P09K17M08R, 18P09K17M08G, 18P09K17M03R, 18P09K17I23X, 18P09K17M03D, 18P09K17M04W, 18P09K17M04L, 18P09K17M04X, 18P09K17M04C, 18P09K17M09I, 18P09K17I24Y, 18P09K17M15G, 18P09K17M15B, 18P09K17M05R, 18P09K17M01G, 18P09K17M01X, 18P09K17M01C, 18P09K17I21X, 18P09K17M06Y, 18P09K17M06D, 18P09K17M01T, 18P09K17M01D, 18P09K17M06P, 18P09K17I21Z, 18P09K17M07G, 18P09K17M07B, 18P09K17M02R, 18P09K17M02P, 18P09K17M02E, 18P09K17I22U, 18P09K17M03K, 18P09K17M03F, 18P09K17I23W, 18P09K17M08S, 18P09K17M08M, 18P09K17M03C, 18P09K17M08N, 18P09K17M03P, 18P09K17M09F, 18P09K17M04Q, 18P09K17M04F, 18P09K17M04M, 18P09K17M09N, 18P09K17M15F, 18P09K17M10Q, 18P09K17M10F, 18P09K17M10A, 18P09K17M05Q, 18P09K17M10W, 18P09K17M05W, 18P09K17M05L, 18P09K17M06R, 18P09K17M01R, 18P09K17M11C, 18P09K17M06M, 18P09K17I21M, 18P09K17I21T, 18P09K17M06Z, 18P09K17M06U, 18P09K17M06E, 18P09K17M07Q, 18P09K17I22V, 18P09K17M02G, 18P09K17M07N, 18P09K17M07I, 18P09K17M02Y, 18P09K17M02N, 18P09K17M02I, 18P09K17M07J, 18P09K17M08K, 18P09K17I23Q, 18P09K17M08L, 18P09K17M08B, 18P09K17M03H, 18P09K17M03E, 18P09K17I23Z, 18P09K17M04A, 18P09K17M04R, 18P09K17M14E, 18P09K17M09Y, 18P09K17M04T, 18P09K17M04J, 18P09K17I24Z, 18P09K17M05F, 18P09K17M05A, 18P09K17M10L, 18P09K17M01L, 18P09K17I21R, 18P09K17M06H, 18P09K17I21H, 18P09K17M11D, 18P09K17M01P, 18P09K17I21P, 18P09K17M07K, 18P09K17M02K, 18P09K17M02A, 18P09K17M07L, 18P09K17M02B, 18P09K17M07X, 18P09K17M02M, 18P09K17I22X, 18P09K17I22Y, 18P09K17M03L, 18P09K17M03G, 18P09K17M03S, 18P09K17M03Y, 18P09K17M03U, 18P09K17M09B, 18P09K17M04S, 18P09K17M09J, 18P09K17M04E, 18P09K17M05V, 18P09K17M11B, 18P09K17I21G, 18P09K17M06N, 18P09K17M01I, 18P09K17M01E, 18P09K17M02Q, 18P09K17I22Q, 18P09K17M07W, 18P09K17M07R, 18P09K17M02L, 18P09K17I22W, 18P09K17I22L, 18P09K17M07S, 18P09K17M07H, 18P09K17I22S, 18P09K17M03T, 18P09K17M08P, 18P09K17M08E, 18P09K17M04V, 18P09K17M04B, 18P09K17M04H, 18P09K17M09Z, 18P09K17M09T, 18P09K17M04D, 18P09K17I25V, 18P09K17M06W, 18P09K17M06L, 18P09K17M01M, 18P09K17M01Y, 18P09K17M01N, 18P09K17I21I, 18P09K17M02S, 18P09K17M02U, 18P09K17M03A, 18P09K17I23V, 18P09K17M03W, 18P09K17M08T, 18P09K17M03I, 18P09K17M08U, 18P09K17M03Z, 18P09K17M09K, 18P09K17M09A, 18P09K17M04K, 18P09K17M09U, 18P09K17M04U, 18P09K17M04N, 18P09K17M15A, 18P09K17M10K, 18P09K17M05K, 18P09K17M10R, 18P09K17M05G, 18P09K17I25W"]
    }, {
      NombreArea: "504741",
      Referencia: "18P09K22A12C",
      Celdas: ["18P09K22A12C, 18P09K22A17E, 18P09K22A13F, 18P09K22A18R, 18P09K22A13R, 18P09K22A13M, 18P09K22A13C, 18P09K22A23I, 18P09K22A13N, 18P09K22A13D, 18P09K22A18P, 18P09K22A14F, 18P09K22A14A, 18P09K22A14L, 18P09K22A19C, 18P09K22A14M, 18P09K22A14J, 18P09K22A09Y, 18P09K22A20A, 18P09K22A10V, 18P09K22A15R, 18P09K22A15E, 18P09K22B11F, 18P09K22B12F, 18P09K22B12G, 18P09K22B12C, 18P09K22B07X, 18P09K22A11B, 18P09K22A06V, 18P09K22A11C, 18P09K22A11I, 18P09K22A11Z, 18P09K22A12Q, 18P09K22A12B, 18P09K22A12S, 18P09K22A18Q, 18P09K22A18A, 18P09K22A13A, 18P09K22A18X, 18P09K22A09V, 18P09K22A19B, 18P09K22A14S, 18P09K22A19E, 18P09K22A14N, 18P09K22A14I, 18P09K22A14D, 18P09K22A10Z, 18P09K22B11K, 18P09K22B12K, 18P09K22A11H, 18P09K22A06Z, 18P09K22A12V, 18P09K22A12K, 18P09K22A12F, 18P09K22A12G, 18P09K22A12Z, 18P09K22A12E, 18P09K22A18K, 18P09K22A18H, 18P09K22A13X, 18P09K22A23D, 18P09K22A13Y, 18P09K22A23E, 18P09K22A13J, 18P09K22A08Z, 18P09K22A19F, 18P09K22A19L, 18P09K22A14W, 18P09K22A09W, 18P09K22A14T, 18P09K22A15V, 18P09K22A15G, 18P09K22A10Y, 18P09K22B11A, 18P09K22B12A, 18P09K22B12H, 18P09K22B12D, 18P09K22A11U, 18P09K22A12W, 18P09K22A12R, 18P09K22A17J, 18P09K22A12U, 18P09K22A12J, 18P09K22A13Q, 18P09K22A13L, 18P09K22A13G, 18P09K22A18T, 18P09K22A08Y, 18P09K22A18E, 18P09K22A13P, 18P09K22A13E, 18P09K22A19G, 18P09K22A14G, 18P09K22A14Z, 18P09K22A15Q, 18P09K22A15M, 18P09K22A15H, 18P09K22A15P, 18P09K22B06W, 18P09K22B11C, 18P09K22B11D, 18P09K22B07V, 18P09K22A06X, 18P09K22A06Y, 18P09K22A12A, 18P09K22A07V, 18P09K22A18F, 18P09K22A13V, 18P09K22A18G, 18P09K22A18C, 18P09K22A18N, 18P09K22A18U, 18P09K22A19A, 18P09K22A14X, 18P09K22A14H, 18P09K22A09X, 18P09K22A14U, 18P09K22A15K, 18P09K22A15A, 18P09K22A15W, 18P09K22A15S, 18P09K22A15C, 18P09K22A15I, 18P09K22B11L, 18P09K22B11H, 18P09K22B06X, 18P09K22B06Y, 18P09K22B07W, 18P09K22B07Y, 18P09K22B07Z, 18P09K22A11N, 18P09K22A11D, 18P09K22A11E, 18P09K22A12X, 18P09K22A12D, 18P09K22A07X, 18P09K22A12P, 18P09K22A08V, 18P09K22A18W, 18P09K22A13W, 18P09K22A13B, 18P09K22A13H, 18P09K22A18D, 18P09K22A13I, 18P09K22A13Z, 18P09K22A19K, 18P09K22A14K, 18P09K22A14R, 18P09K22A15B, 18P09K22A15T, 18P09K22B11M, 18P09K22B11I, 18P09K22B11J, 18P09K22B06Z, 18P09K22B12E, 18P09K22A12L, 18P09K22A07W, 18P09K22A12T, 18P09K22A12H, 18P09K22A07Z, 18P09K22A13K, 18P09K22A18B, 18P09K22A23C, 18P09K22A18S, 18P09K22A18M, 18P09K22A13S, 18P09K22A08X, 18P09K22A18Y, 18P09K22A18J, 18P09K22A13U, 18P09K22A14V, 18P09K22A14B, 18P09K22A19H, 18P09K22A14Y, 18P09K22A14E, 18P09K22A09Z, 18P09K22A15F, 18P09K22A15L, 18P09K22A10W, 18P09K22A15D, 18P09K22B11Q, 18P09K22B06V, 18P09K22B12L, 18P09K22B12B, 18P09K22A06W, 18P09K22A11P, 18P09K22A11J, 18P09K22A12Y, 18P09K22A12M, 18P09K22A12N, 18P09K22A12I, 18P09K22A07Y, 18P09K22A18L, 18P09K22A08W, 18P09K22A18I, 18P09K22A13T, 18P09K22A18Z, 18P09K22A14Q, 18P09K22A19M, 18P09K22A14C, 18P09K22A19D, 18P09K22A14P, 18P09K22A10X, 18P09K22A15N, 18P09K22A15U, 18P09K22A15J, 18P09K22B11G, 18P09K22B11B, 18P09K22B11E"]
    }, {
      NombreArea: "504743",
      Referencia: "18P09K16Q16R",
      Celdas: ["18P09K16Q16R, 18P09K16Q11G, 18P09K16Q01A, 18P09K16Q11H, 18P09K16Q06X, 18P09K16Q11D, 18P09K16Q06Z, 18P09K16Q07Q, 18P09K16Q07A, 18P09K16Q02A, 18P09K16Q17S, 18P09K16Q07C, 18P09K16Q02X, 18P09K16Q12J, 18P09K16Q07J, 18P09K16Q02E, 18P09K16Q18F, 18P09K16Q13W, 18P09K16Q13G, 18P09K16Q08F, 18P09K16Q03Q, 18P09K16Q03A, 18P09K16Q13H, 18P09K16Q03M, 18P09K16Q03C, 18P09K16Q08N, 18P09K16Q03Y, 18P09K16Q03I, 18P09K16Q19Q, 18P09K16Q19K, 18P09K16Q14Q, 18P09K16Q09F, 18P09K16Q04Q, 18P09K16Q04F, 18P09K16Q19G, 18P09K16Q14W, 18P09K16Q14L, 18P09K16Q14G, 18P09K16Q09G, 18P09K16Q04W, 18P09K16Q19I, 18P09K16Q14D, 18P09K16Q24Z, 18P09K16Q14J, 18P09K16Q04E, 18P09K16Q25K, 18P09K16Q20V, 18P09K16Q15V, 18P09K16Q05Q, 18P09K16Q05A, 18P09K16Q20G, 18P09K16Q15W, 18P09K16Q10H, 18P09K16Q05X, 18P09K16Q05R, 18P09K16Q10I, 18P09K16Q10D, 18P09K16Q20P, 18P09K16Q15J, 18P09K16Q10U, 18P09K17M16K, 18P09K17M16A, 18P09K17M01F, 18P09K17M16H, 18P09K17M17Q, 18P09K17M17A, 18P09K17M12Y, 18P09K16Q16K, 18P09K16Q16F, 18P09K16Q16B, 18P09K16Q11A, 18P09K16Q11B, 18P09K16Q06W, 18P09K16Q01V, 18P09K16Q01F, 18P09K16Q06S, 18P09K16Q06C, 18P09K16Q01S, 18P09K16Q16T, 18P09K16Q11I, 18P09K16Q06Y, 18P09K16Q01N, 18P09K16Q11U, 18P09K16Q01P, 18P09K16Q12K, 18P09K16Q07K, 18P09K16Q02F, 18P09K16Q12L, 18P09K16Q07W, 18P09K16Q17M, 18P09K16Q17H, 18P09K16Q17C, 18P09K16Q07S, 18P09K16Q12T, 18P09K16Q12N, 18P09K16Q12I, 18P09K16Q02D, 18P09K16Q17P, 18P09K16Q12Z, 18P09K16Q12E, 18P09K16Q07Z, 18P09K16Q18Q, 18P09K16Q18L, 18P09K16Q18B, 18P09K16Q13V, 18P09K16Q13Q, 18P09K16Q13B, 18P09K16Q08W, 18P09K16Q08G, 18P09K16Q03L, 18P09K16Q03G, 18P09K16Q18S, 18P09K16Q08X, 18P09K16Q18T, 18P09K16Q13N, 18P09K16Q03D, 18P09K16Q13P, 18P09K16Q08J, 18P09K16Q08E, 18P09K16Q14A, 18P09K16Q14R, 18P09K16Q04R, 18P09K16Q19M, 18P09K16Q19H, 18P09K16Q14X, 18P09K16Q14C, 18P09K16Q09M, 18P09K16Q09C, 18P09K16Q04S, 18P09K16Q04C, 18P09K16Q19D, 18P09K16Q09P, 18P09K16Q09J, 18P09K16Q25V, 18P09K16Q05K, 18P09K16Q25B, 18P09K16Q20W, 18P09K16Q20X, 18P09K16Q15R, 18P09K16Q15S, 18P09K16Q10S, 18P09K16Q05G, 18P09K16Q05B, 18P09K16Q25D, 18P09K16Q20Y, 18P09K16Q20T, 18P09K16Q10N, 18P09K16Q05D, 18P09K16Q25E, 18P09K16Q20U, 18P09K16Q20J, 18P09K17M11K, 18P09K17M06Q, 18P09K17M16R, 18P09K17M16X, 18P09K17M17C, 18P09K17M17D, 18P09K16Q16L, 18P09K16Q06G, 18P09K16Q01W, 18P09K16Q01B, 18P09K16Q11S, 18P09K16Q11Y, 18P09K16Q06T, 18P09K16Q06I, 18P09K16Q06D, 18P09K16Q01T, 18P09K16Q16P, 18P09K16Q16J, 18P09K16Q17F, 18P09K16Q02K, 18P09K16Q12G, 18P09K16Q12B, 18P09K16Q02W, 18P09K16Q02R, 18P09K16Q07X, 18P09K16Q02H, 18P09K16Q17T, 18P09K16Q07Y, 18P09K16Q07N, 18P09K16Q02I, 18P09K16Q02J, 18P09K16Q18K, 18P09K16Q18G, 18P09K16Q13K, 18P09K16Q08R, 18P09K16Q08K, 18P09K16Q03F, 18P09K16Q03B, 18P09K16Q08S, 18P09K16Q08H, 18P09K16Q03X, 18P09K16Q18N, 18P09K16Q08I, 18P09K16Q18U, 18P09K16Q18J, 18P09K16Q13J, 18P09K16Q09K, 18P09K16Q04A, 18P09K16Q09B, 18P09K16Q19S, 18P09K16Q09X, 18P09K16Q04M, 18P09K16Q14N, 18P09K16Q04I, 18P09K16Q14U, 18P09K16Q09E, 18P09K16Q20K, 18P09K16Q15A, 18P09K16Q05F, 18P09K16Q15B, 18P09K16Q10G, 18P09K16Q05C, 18P09K16Q20N, 18P09K16Q10T, 18P09K16Q15U, 18P09K16Q05J, 18P09K17M16V, 18P09K17M16S, 18P09K17M16C, 18P09K17M16Y, 18P09K17M16I, 18P09K17M16Z, 18P09K17M16E, 18P09K17M17G, 18P09K17M17H, 18P09K16Q16Q, 18P09K16Q16A, 18P09K16Q11W, 18P09K16Q11L, 18P09K16Q11F, 18P09K16Q06K, 18P09K16Q01R, 18P09K16Q16C, 18P09K16Q11N, 18P09K16Q06E, 18P09K16Q12W, 18P09K16Q07L, 18P09K16Q02G, 18P09K16Q12X, 18P09K16Q17J, 18P09K16Q12P, 18P09K16Q07U, 18P09K16Q02P, 18P09K16Q18R, 18P09K16Q08B, 18P09K16Q13X, 18P09K16Q13S, 18P09K16Q08M, 18P09K16Q18E, 18P09K16Q13Z, 18P09K16Q13U, 18P09K16Q13E, 18P09K16Q19A, 18P09K16Q14V, 18P09K16Q14F, 18P09K16Q09V, 18P09K16Q09R, 18P09K16Q14H, 18P09K16Q19N, 18P09K16Q09Y, 18P09K16Q09T, 18P09K16Q09D, 18P09K16Q04N, 18P09K16Q24E, 18P09K16Q15K, 18P09K16Q10F, 18P09K16Q10A, 18P09K16Q15M, 18P09K16Q10C, 18P09K16Q15P, 18P09K16Q15E, 18P09K16Q05Z, 18P09K17M21A, 18P09K17M06V, 18P09K17M06K, 18P09K17M16W, 18P09K17M16T, 18P09K17M16U, 18P09K17M17R, 18P09K16Q11Q, 18P09K16Q06Q, 18P09K16Q06A, 18P09K16Q01K, 18P09K16Q01L, 18P09K16Q01G, 18P09K16Q16H, 18P09K16Q11X, 18P09K16Q01H, 18P09K16Q01C, 18P09K16Q16N, 18P09K16Q11T, 18P09K16Q01I, 18P09K16Q01D, 18P09K16Q16U, 18P09K16Q11E, 18P09K16Q06U, 18P09K16Q01E, 18P09K16Q12V, 18P09K16Q12F, 18P09K16Q17R, 18P09K16Q17G, 18P09K16Q07G, 18P09K16Q07B, 18P09K16Q02B, 18P09K16Q02S, 18P09K16Q17N, 18P09K16Q17D, 18P09K16Q02T, 18P09K16Q13R, 18P09K16Q03W, 18P09K16Q18C, 18P09K16Q03S, 18P09K16Q03H, 18P09K16Q18P, 18P09K16Q03U, 18P09K16Q04K, 18P09K16Q04L, 18P09K16Q04G, 18P09K16Q04H, 18P09K16Q14T, 18P09K16Q09N, 18P09K16Q09Z, 18P09K16Q20F, 18P09K16Q10K, 18P09K16Q20R, 18P09K16Q20M, 18P09K16Q20H, 18P09K16Q20C, 18P09K16Q15G, 18P09K16Q15C, 18P09K16Q05W, 18P09K16Q15N, 18P09K16Q15I, 18P09K16Q05U, 18P09K17M16F, 18P09K17M11V, 18P09K17M21B, 18P09K17M21D, 18P09K17M17V, 18P09K17M17F, 18P09K17M17B, 18P09K17M12X, 18P09K17M12Z, 18P09K16Q16G, 18P09K16Q11V, 18P09K16Q11R, 18P09K16Q06B, 18P09K16Q11M, 18P09K16Q11C, 18P09K16Q06M, 18P09K16Q06H, 18P09K16Q16I, 18P09K16Q06N, 18P09K16Q16E, 18P09K16Q11P, 18P09K16Q11J, 18P09K16Q06P, 18P09K16Q01J, 18P09K16Q17Q, 18P09K16Q12A, 18P09K16Q07V, 18P09K16Q07F, 18P09K16Q02V, 18P09K16Q02Q, 18P09K16Q17B, 18P09K16Q12R, 18P09K16Q12M, 18P09K16Q12C, 18P09K16Q07M, 18P09K16Q07H, 18P09K16Q12D, 18P09K16Q07I, 18P09K16Q07D, 18P09K16Q02N, 18P09K16Q18A, 18P09K16Q08V, 18P09K16Q08Q, 18P09K16Q03V, 18P09K16Q18M, 18P09K16Q13C, 18P09K16Q08C, 18P09K16Q13T, 18P09K16Q03N, 18P09K16Q08U, 18P09K16Q03P, 18P09K16Q19F, 18P09K16Q09A, 18P09K16Q19L, 18P09K16Q19B, 18P09K16Q09S, 18P09K16Q09H, 18P09K16Q04T, 18P09K16Q04D, 18P09K16Q19U, 18P09K16Q04P, 18P09K16Q25F, 18P09K16Q25A, 18P09K16Q15Q, 18P09K16Q10Q, 18P09K16Q20S, 18P09K16Q20B, 18P09K16Q15L, 18P09K16Q10L, 18P09K16Q05S, 18P09K16Q20I, 18P09K16Q05N, 18P09K16Q20E, 18P09K16Q10Z, 18P09K16Q10J, 18P09K16Q05E, 18P09K17M11Q, 18P09K17M06A, 18P09K17M01Q, 18P09K17M16B, 18P09K17M16D, 18P09K17M21E, 18P09K16Q11K, 18P09K16Q06L, 18P09K16Q01Y, 18P09K16Q06J, 18P09K16Q01Z, 18P09K16Q01U, 18P09K16Q17K, 18P09K16Q17A, 18P09K16Q12Q, 18P09K16Q02L, 18P09K16Q12H, 18P09K16Q02M, 18P09K16Q02C, 18P09K16Q12Y, 18P09K16Q07T, 18P09K16Q02Y, 18P09K16Q17U, 18P09K16Q17E, 18P09K16Q12U, 18P09K16Q07P, 18P09K16Q02Z, 18P09K16Q13A, 18P09K16Q03K, 18P09K16Q18H, 18P09K16Q13M, 18P09K16Q18I, 18P09K16Q13Y, 18P09K16Q13I, 18P09K16Q08T, 18P09K16Q03T, 18P09K16Q08Z, 18P09K16Q08P, 18P09K16Q03Z, 18P09K16Q03J, 18P09K16Q03E, 18P09K16Q04V, 18P09K16Q09W, 18P09K16Q14M, 18P09K16Q19T, 18P09K16Q14Y, 18P09K16Q24U, 18P09K16Q24P, 18P09K16Q19Z, 18P09K16Q14E, 18P09K16Q09U, 18P09K16Q20Q, 18P09K16Q20A, 18P09K16Q15F, 18P09K16Q10V, 18P09K16Q05V, 18P09K16Q20L, 18P09K16Q15X, 18P09K16Q15H, 18P09K16Q10W, 18P09K16Q10R, 18P09K16Q10M, 18P09K16Q10B, 18P09K16Q05L, 18P09K16Q05M, 18P09K16Q20D, 18P09K16Q15T, 18P09K16Q10Y, 18P09K16Q05Y, 18P09K16Q05T, 18P09K16Q20Z, 18P09K16Q15Z, 18P09K17M11F, 18P09K17M11A, 18P09K17M01V, 18P09K17M01A, 18P09K17M21C, 18P09K17M16M, 18P09K17M16N, 18P09K17M16P, 18P09K16Q06V, 18P09K16Q06R, 18P09K16Q06F, 18P09K16Q01Q, 18P09K16Q16S, 18P09K16Q16M, 18P09K16Q01X, 18P09K16Q01M, 18P09K16Q16D, 18P09K16Q11Z, 18P09K16Q17L, 18P09K16Q07R, 18P09K16Q12S, 18P09K16Q17I, 18P09K16Q07E, 18P09K16Q02U, 18P09K16Q13L, 18P09K16Q13F, 18P09K16Q08L, 18P09K16Q08A, 18P09K16Q03R, 18P09K16Q18D, 18P09K16Q13D, 18P09K16Q08Y, 18P09K16Q08D, 18P09K16Q14K, 18P09K16Q09Q, 18P09K16Q19R, 18P09K16Q14B, 18P09K16Q09L, 18P09K16Q04B, 18P09K16Q19C, 18P09K16Q14S, 18P09K16Q04X, 18P09K16Q14I, 18P09K16Q09I, 18P09K16Q04Y, 18P09K16Q24J, 18P09K16Q19P, 18P09K16Q19J, 18P09K16Q19E, 18P09K16Q14Z, 18P09K16Q14P, 18P09K16Q04Z, 18P09K16Q04U, 18P09K16Q04J, 18P09K16Q25Q, 18P09K16Q25C, 18P09K16Q10X, 18P09K16Q05H, 18P09K16Q15Y, 18P09K16Q15D, 18P09K16Q05I, 18P09K16Q10P, 18P09K16Q10E, 18P09K16Q05P, 18P09K17M16Q, 18P09K17M06F, 18P09K17M01K, 18P09K17M16L, 18P09K17M16G, 18P09K17M16J, 18P09K17M17K, 18P09K17M17L"]
    }, {
      NombreArea: "504746",
      Referencia: "18P09K21C19I",
      Celdas: ["18P09K21C19I, 18P09K21C20Q, 18P09K21C15W, 18P09K21C25C, 18P09K21C20C, 18P09K21C20N, 18P09K21C20Z, 18P09K21C20P, 18P09K21C20G, 18P09K21C20Y, 18P09K21C25E, 18P09K21C20U, 18P09K21C20J, 18P09K21C19J, 18P09K21C25M, 18P09K21C20X, 18P09K21C25B, 18P09K21C20R, 18P09K21C15X, 18P09K21C20D, 18P09K21C20K, 18P09K21C20W, 18P09K21C15Y, 18P09K21C20E, 18P09K21C15U, 18P09K21C25D, 18P09K21C20T, 18P09K21C20I, 18P09K21C15T, 18P09K21C15Z, 18P09K21C19P, 18P09K21C20F, 18P09K21C20B, 18P09K21C20S, 18P09K21C20M, 18P09K21C20H, 18P09K21C25N, 18P09K21C25I, 18P09K21C25J, 18P09K21C20V, 18P09K21C20A, 18P09K21C20L, 18P09K21C25H"]
    }
    , 
    {
      NombreArea: "507529",
      Referencia: "18P09K04G21Z",
      Celdas: ["18P09K04G21Z, 18P09K04G21N, 18P09K04G16Y, 18P09K04G16T, 18P09K04G16D, 18P09K04G22K, 18P09K04G17F, 18P09K04G22N, 18P09K04G22I, 18P09K04G23K, 18P09K04G23A, 18P09K04G23B, 18P09K04G18F, 18P09K04G18G, 18P09K04G23H, 18P09K04G18S, 18P09K04G23D, 18P09K04G18I, 18P09K04G23U, 18P09K04G19F, 18P09K04G24B, 18P09K04G19W, 18P09K04G21E, 18P09K04G22V, 18P09K04G22Q, 18P09K04G22F, 18P09K04G22B, 18P09K04G17L, 18P09K04G17G, 18P09K04G17D, 18P09K04G22U, 18P09K04G18B, 18P09K04G18X, 18P09K04G18N, 18P09K04G18U, 18P09K04G24F, 18P09K04G24A, 18P09K04G19Q, 18P09K04G19K, 18P09K04G24R, 18P09K04G19L, 18P09K04G17Q, 18P09K04G22R, 18P09K04G22G, 18P09K04G22T, 18P09K04G22D, 18P09K04G17I, 18P09K04G17P, 18P09K04G23M, 18P09K04G18P, 18P09K04G24Q, 18P09K04G19A, 18P09K04G21U, 18P09K04G16Z, 18P09K04G16I, 18P09K04G17A, 18P09K04G22M, 18P09K04G23R, 18P09K04G23S, 18P09K04G23I, 18P09K04G18D, 18P09K04G23P, 18P09K04G19V, 18P09K04G19G, 18P09K04G16U, 18P09K04G17K, 18P09K04G22L, 18P09K04G17W, 18P09K04G22S, 18P09K04G22H, 18P09K04G22C, 18P09K04G17X, 18P09K04G22J, 18P09K04G17U, 18P09K04G17E, 18P09K04G23F, 18P09K04G23G, 18P09K04G18V, 18P09K04G18Q, 18P09K04G18K, 18P09K04G23E, 18P09K04G18Z, 18P09K04G18E, 18P09K04G24K, 18P09K04G19R, 18P09K04G19B, 18P09K04G21I, 18P09K04G21J, 18P09K04G21D, 18P09K04G17R, 18P09K04G17T, 18P09K04G22P, 18P09K04G17Z, 18P09K04G23L, 18P09K04G23C, 18P09K04G23N, 18P09K04G18Y, 18P09K04G24L, 18P09K04G21P, 18P09K04G16N, 18P09K04G16E, 18P09K04G22A, 18P09K04G17V, 18P09K04G17S, 18P09K04G17M, 18P09K04G17Y, 18P09K04G22E, 18P09K04G18W, 18P09K04G18R, 18P09K04G18L, 18P09K04G18M, 18P09K04G18H, 18P09K04G23J, 18P09K04G18J, 18P09K04G21Y, 18P09K04G21T, 18P09K04G16P, 18P09K04G16J, 18P09K04G17B, 18P09K04G17H, 18P09K04G17C, 18P09K04G17N, 18P09K04G17J, 18P09K04G23Q, 18P09K04G18A, 18P09K04G18C, 18P09K04G23T, 18P09K04G18T, 18P09K04G24G"]
    },
    {
      NombreArea: "507941",
      Referencia: "18P09G24L16W",
      Celdas: ["18P09G24L16W, 18P09G24L16J, 18P09G24L12X, 18P09G24L12S, 18P09G24L22E, 18P09G24L17J, 18P09G24L12U, 18P09G24L12P, 18P09G24L18Q, 18P09G24L18L, 18P09G24L13G, 18P09G24L18H, 18P09G24L18I, 18P09G24L13D, 18P09G24L14F, 18P09G24L19G, 18P09G24L09S, 18P09G24L09C, 18P09G24L09U, 18P09G24L04Z, 18P09G24L10B, 18P09G24L05R, 18P09G24L05L, 18P09G24L15D, 18P09G24L10I, 18P09G24L10D, 18P09G24L05T, 18P09G25I01F, 18P09G24K20Z, 18P09G24L17T, 18P09G24L18F, 18P09G24L13V, 18P09G24L13K, 18P09G24L23G, 18P09G24L23B, 18P09G24L18X, 18P09G24L13E, 18P09G24L08Z, 18P09G24L19A, 18P09G24L09B, 18P09G24L14H, 18P09G24L05V, 18P09G24L05K, 18P09G24L05W, 18P09G24L10H, 18P09G24L05N, 18P09G24L05E, 18P09G25I01L, 18P09G25I01M, 18P09G24L16R, 18P09G24L21C, 18P09G24L16Y, 18P09G24L17Q, 18P09G24L17G, 18P09G24L12W, 18P09G24L17I, 18P09G24L22J, 18P09G24L12Z, 18P09G24L18C, 18P09G24L13X, 18P09G24L13H, 18P09G24L08X, 18P09G24L18N, 18P09G24L19F, 18P09G24L14R, 18P09G24L14C, 18P09G24L09X, 18P09G24L09H, 18P09G24L09P, 18P09G24L10K, 18P09G24L15H, 18P09G24L10M, 18P09G24L05M, 18P09G24L10T, 18P09G24L10U, 18P09G24L05P, 18P09G24L05J, 18P09G25I01K, 18P09G25I06G, 18P09G25I01R, 18P09G25I06C, 18P09G25I01X, 18P09G24L21D, 18P09G24L22A, 18P09G24L22G, 18P09G24L22H, 18P09G24L17D, 18P09G24L12T, 18P09G24L13Q, 18P09G24L13F, 18P09G24L13W, 18P09G24L08W, 18P09G24L18Y, 18P09G24L13T, 18P09G24L18J, 18P09G24L13J, 18P09G24L14K, 18P09G24L09W, 18P09G24L14X, 18P09G24L14S, 18P09G24L09I, 18P09G24L09D, 18P09G24L09E, 18P09G24L04U, 18P09G24L15K, 18P09G24L15A, 18P09G24L10V, 18P09G24L10Q, 18P09G24L10A, 18P09G24L15G, 18P09G24L10R, 18P09G24L10C, 18P09G24L05H, 18P09G24L10Z, 18P09G24L05Z, 18P09G25I06B, 18P09G25I06I, 18P09G25I06D, 18P09G24L16P, 18P09G24L16E, 18P09G24L17A, 18P09G24L12V, 18P09G24L17W, 18P09G24L12Y, 18P09G24L17E, 18P09G24L12J, 18P09G24L23A, 18P09G24L18A, 18P09G24L18R, 18P09G24L13L, 18P09G24L23C, 18P09G24L18T, 18P09G24L13Y, 18P09G24L18U, 18P09G24L13Z, 18P09G24L08U, 18P09G24L14V, 18P09G24L14B, 18P09G24L09R, 18P09G24L09L, 18P09G24L19C, 18P09G24L14M, 18P09G24L14U, 18P09G24L14J, 18P09G24L09J, 18P09G24L15F, 18P09G24L15C, 18P09G24L10X, 18P09G24L05X, 18P09G24L05D, 18P09G25I06K, 18P09G25I06A, 18P09G25I01V, 18P09G25I01G, 18P09G25I06H, 18P09G25I01S, 18P09G25I01T, 18P09G24L16X, 18P09G24L16N, 18P09G24L16Z, 18P09G24L17F, 18P09G24L17L, 18P09G24L22D, 18P09G24L17Y, 18P09G24L12N, 18P09G24L17Z, 18P09G24L17P, 18P09G24L23F, 18P09G24L13A, 18P09G24L18B, 18P09G24L13R, 18P09G24L13B, 18P09G24L18S, 18P09G24L13C, 18P09G24L18D, 18P09G24L13N, 18P09G24L13I, 18P09G24L08Y, 18P09G24L08T, 18P09G24L13P, 18P09G24L14Q, 18P09G24L09K, 18P09G24L19B, 18P09G24L14Y, 18P09G24L14T, 18P09G24L14I, 18P09G24L04Y, 18P09G24L05Q, 18P09G24L15B, 18P09G24L10W, 18P09G24L10G, 18P09G24L05G, 18P09G24L10S, 18P09G24L10Y, 18P09G24L10N, 18P09G24L10E, 18P09G25I01Q, 18P09G25I06L, 18P09G25I06M, 18P09G25I06E, 18P09G24L16V, 18P09G24L16S, 18P09G24L16M, 18P09G24L16I, 18P09G24L21E, 18P09G24L16U, 18P09G24L17V, 18P09G24L22B, 18P09G24L17R, 18P09G24L17B, 18P09G24L22I, 18P09G24L17S, 18P09G24L17M, 18P09G24L17C, 18P09G24L17U, 18P09G24L18V, 18P09G24L18K, 18P09G24L18W, 18P09G24L18G, 18P09G24L18M, 18P09G24L13M, 18P09G24L18P, 18P09G24L19K, 18P09G24L14A, 18P09G24L14W, 18P09G24L14L, 18P09G24L14G, 18P09G24L14N, 18P09G24L14P, 18P09G24L14D, 18P09G24L09Y, 18P09G24L09Z, 18P09G24L09N, 18P09G24L15Q, 18P09G24L15L, 18P09G24L10L, 18P09G24L10P, 18P09G24L10J, 18P09G24L05U, 18P09G25I06Q, 18P09G25I06F, 18P09G25I01Y, 18P09G25I01Z, 18P09G24L16T, 18P09G24L17K, 18P09G24L22C, 18P09G24L17X, 18P09G24L17N, 18P09G24L17H, 18P09G24L13S, 18P09G24L18E, 18P09G24L13U, 18P09G24L08P, 18P09G24L09V, 18P09G24L09Q, 18P09G24L09F, 18P09G24L09G, 18P09G24L09M, 18P09G24L04X, 18P09G24L14E, 18P09G24L09T, 18P09G24L10F, 18P09G24L05S, 18P09G24L05C, 18P09G24L05Y, 18P09G24L05I, 18P09G24H25Y, 18P09G25I01W"]
    }, {
      NombreArea: "51166XX",
      Referencia: "18P09K04B20E",
      Celdas: ["18P09K04B10N, 18P09K04B20E, 18P09K04C06V, 18P09K04C11S, 18P09K04C11T, 18P09K04C11D, 18P09K04C06N, 18P09K04C16E, 18P09K04C11J, 18P09K04C17A, 18P09K04C12Q, 18P09K04C12K, 18P09K04C12R, 18P09K04C12G, 18P09K04C07R, 18P09K04C07G, 18P09K04C12H, 18P09K04C12C, 18P09K04C07H, 18P09K04C07N, 18P09K04B10T, 18P09K04C06F, 18P09K04C06G, 18P09K04C16D, 18P09K04C06T, 18P09K04C11U, 18P09K04C12F, 18P09K04C12L, 18P09K04C12B, 18P09K04C17H, 18P09K04C07X, 18P09K04C12I, 18P09K04C07Y, 18P09K04C17J, 18P09K04C07Z, 18P09K04B15N, 18P09K04C11K, 18P09K04B10Z, 18P09K04C06K, 18P09K04C16B, 18P09K04C11R, 18P09K04C06W, 18P09K04C16C, 18P09K04C06X, 18P09K04C11E, 18P09K04C17F, 18P09K04C12A, 18P09K04C17B, 18P09K04C12D, 18P09K04C07T, 18P09K04C12J, 18P09K04C07P, 18P09K04B10Y, 18P09K04B15E, 18P09K04C06Q, 18P09K04B10J, 18P09K04C11G, 18P09K04C11B, 18P09K04C06S, 18P09K04C11Y, 18P09K04C11N, 18P09K04C06I, 18P09K04C07F, 18P09K04C12W, 18P09K04C07M, 18P09K04C17I, 18P09K04C12U, 18P09K04C07U, 18P09K04B20I, 18P09K04B20D, 18P09K04B15T, 18P09K04B15Z, 18P09K04C11Q, 18P09K04C11A, 18P09K04C11W, 18P09K04C11L, 18P09K04C06L, 18P09K04C11M, 18P09K04C11I, 18P09K04C12V, 18P09K04C17G, 18P09K04C07W, 18P09K04C17C, 18P09K04C12M, 18P09K04C07S, 18P09K04C12Z, 18P09K04C07J, 18P09K04B15I, 18P09K04B10I, 18P09K04B20J, 18P09K04B10P, 18P09K04C06M, 18P09K04C16I, 18P09K04C11Z, 18P09K04C11P, 18P09K04C06U, 18P09K04C07V, 18P09K04C07Q, 18P09K04B15Y, 18P09K04C16F, 18P09K04C11V, 18P09K04B15U, 18P09K04C11F, 18P09K04B10U, 18P09K04C11X, 18P09K04C16J, 18P09K04C06Z, 18P09K04C06P, 18P09K04C06J, 18P09K04C12X, 18P09K04C17D, 18P09K04C12Y, 18P09K04C12T, 18P09K04C17E, 18P09K04C12P, 18P09K04B15D, 18P09K04C16A, 18P09K04B15P, 18P09K04B15J, 18P09K04C16G, 18P09K04C06R, 18P09K04C16H, 18P09K04C11H, 18P09K04C11C, 18P09K04C06H, 18P09K04C06Y, 18P09K04C07K, 18P09K04C07L, 18P09K04C12S, 18P09K04C12N, 18P09K04C07I, 18P09K04C12E"]
    }, {
      NombreArea: "511046",
      Referencia: "18P09K04A20B",
      Celdas: ["18P09K04A20B, 18P09K04A20H, 18P09K04A20T, 18P09K04A15T, 18P09K04A20Z, 18P09K04B16Q, 18P09K04B21B, 18P09K04B16R, 18P09K04B16B, 18P09K04B11I, 18P09K04B17K, 18P09K04B17W, 18P09K04B17R, 18P09K04B12R, 18P09K04B12Y, 18P09K04B12P, 18P09K04A20W, 18P09K04A20R, 18P09K04A15R, 18P09K04A15K, 18P09K04A15G, 18P09K04A20M, 18P09K04A20Y, 18P09K04A20D, 18P09K04A15Y, 18P09K04A20E, 18P09K04A15J, 18P09K04B16L, 18P09K04B11W, 18P09K04B21C, 18P09K04B16Y, 18P09K04B16T, 18P09K04B16D, 18P09K04B11X, 18P09K04B11S, 18P09K04B11N, 18P09K04B16U, 18P09K04B16P, 18P09K04B11U, 18P09K04B22H, 18P09K04B17X, 18P09K04B17M, 18P09K04B12M, 18P09K04B17I, 18P09K04B12U, 18P09K04A15W, 18P09K04A15X, 18P09K04A25D, 18P09K04A20P, 18P09K04B16F, 18P09K04B11V, 18P09K04B16G, 18P09K04B16S, 18P09K04B11M, 18P09K04B11J, 18P09K04B17A, 18P09K04B12V, 18P09K04B12K, 18P09K04B22B, 18P09K04B12G, 18P09K04B12X, 18P09K04B12S, 18P09K04B12H, 18P09K04B22E, 18P09K04A25A, 18P09K04A25B, 18P09K04A20K, 18P09K04A20L, 18P09K04A20N, 18P09K04A15I, 18P09K04A20U, 18P09K04A20J, 18P09K04A15U, 18P09K04B16V, 18P09K04B11K, 18P09K04B11H, 18P09K04B21J, 18P09K04B17Q, 18P09K04B17S, 18P09K04B17D, 18P09K04B12T, 18P09K04B22J, 18P09K04B17U, 18P09K04A15L, 18P09K04A15M, 18P09K04A15H, 18P09K04A20I, 18P09K04A15N, 18P09K04B11R, 18P09K04B21H, 18P09K04B21D, 18P09K04B16X, 18P09K04B11Y, 18P09K04B11T, 18P09K04B22F, 18P09K04B17F, 18P09K04B12F, 18P09K04B17L, 18P09K04B17G, 18P09K04B17B, 18P09K04B12W, 18P09K04B22I, 18P09K04B17Y, 18P09K04A20V, 18P09K04A20Q, 18P09K04A20G, 18P09K04A20A, 18P09K04A15V, 18P09K04A25C, 18P09K04A20X, 18P09K04A25E, 18P09K04A15Z, 18P09K04B16K, 18P09K04B11Q, 18P09K04B11F, 18P09K04B11L, 18P09K04B16M, 18P09K04B16H, 18P09K04B16I, 18P09K04B21E, 18P09K04B16J, 18P09K04B22A, 18P09K04B12L, 18P09K04B22C, 18P09K04B17C, 18P09K04B12I, 18P09K04B17P, 18P09K04B17E, 18P09K04B12Z, 18P09K04A15F, 18P09K04A20S, 18P09K04A15S, 18P09K04B21A, 18P09K04B16A, 18P09K04B11G, 18P09K04B21I, 18P09K04B16E, 18P09K04B11Z, 18P09K04B11P, 18P09K04B12Q, 18P09K04B22G, 18P09K04B17H, 18P09K04B17T, 18P09K04B17J, 18P09K04B12J, 18P09K04A20F, 18P09K04A15Q, 18P09K04A20C, 18P09K04A15P, 18P09K04B16W, 18P09K04B16N, 18P09K04B16C, 18P09K04B16Z, 18P09K04B17V, 18P09K04B22D, 18P09K04B17N, 18P09K04B12N, 18P09K04B17Z"]
    }, {
      NombreArea: "510593",
      Referencia: "18P09K21L03L",
      Celdas: ["18P09K21L03L, 18P09K21H23M, 18P09K21H23Z, 18P09K21H23P, 18P09K21L04A, 18P09K21H19V, 18P09K21H19K, 18P09K21H19G, 18P09K21L09C, 18P09K21H24M, 18P09K21H19X, 18P09K21H24I, 18P09K21H19D, 18P09K21L09U, 18P09K21L04U, 18P09K21H24U, 18P09K21H19J, 18P09K21H14J, 18P09K21L10K, 18P09K21L10F, 18P09K21H25K, 18P09K21H25F, 18P09K21H15F, 18P09K21L05S, 18P09K21H25C, 18P09K21H15L, 18P09K21H10W, 18P09K21H10S, 18P09K21L10Y, 18P09K21L05T, 18P09K21H25N, 18P09K21H15T, 18P09K21L10Z, 18P09K21L10E, 18P09K21H20Z, 18P09K22I06A, 18P09K22E21V, 18P09K22I01G, 18P09K22E21G, 18P09K22E16W, 18P09K22E11L, 18P09K22E01W, 18P09K22E21X, 18P09K22E06M, 18P09K22I11T, 18P09K22I01D, 18P09K22E21T, 18P09K22E16D, 18P09K22E06D, 18P09K22I11U, 18P09K22I11E, 18P09K22I01P, 18P09K22E16U, 18P09K22I12V, 18P09K22I12F, 18P09K22I07Q, 18P09K22E17A, 18P09K22E12K, 18P09K22E02V, 18P09K22I07W, 18P09K22I02L, 18P09K22E22R, 18P09K22E17G, 18P09K22I07N, 18P09K22I02M, 18P09K22E17T, 18P09K22E17H, 18P09K22E12H, 18P09K22I17P, 18P09K22I17J, 18P09K22E22P, 18P09K22E17J, 18P09K22E07E, 18P09K22E02Z, 18P09K22I18A, 18P09K22I13Q, 18P09K22I13A, 18P09K22I08V, 18P09K22I08F, 18P09K22E18F, 18P09K22E13F, 18P09K22E08Q, 18P09K22E03K, 18P09K22I18G, 18P09K22I13B, 18P09K22I03W, 18P09K22E23L, 18P09K22E18W, 18P09K22E03W, 18P09K22E03G, 18P09K22I08S, 18P09K22I08H, 18P09K22I08C, 18P09K22E23C, 18P09K22E18X, 18P09K22I13N, 18P09K22I03Y, 18P09K22E23Y, 18P09K22E23I, 18P09K22E13I, 18P09K22E08T, 18P09K22E08I, 18P09K22E03T, 18P09K22E03D, 18P09K22I13Z, 18P09K22E23J, 18P09K22I09F, 18P09K22E24V, 18P09K22E19A, 18P09K22E14A, 18P09K22E09V, 18P09K22E09F, 18P09K22I19L, 18P09K22I14L, 18P09K22I09B, 18P09K22E24R, 18P09K22E19W, 18P09K22E09R, 18P09K22E09G, 18P09K22A24B, 18P09K22I14M, 18P09K22I09X, 18P09K22I04S, 18P09K22E19C, 18P09K22E09X, 18P09K22E09M, 18P09K22E04C, 18P09K22I24T, 18P09K22I19Z, 18P09K22I14Y, 18P09K22I14I, 18P09K22I04Y, 18P09K22E24P, 18P09K22E24I, 18P09K22I25Q, 18P09K22I20V, 18P09K22I10Q, 18P09K22I05V, 18P09K22I05Q, 18P09K22E10V, 18P09K22E05K, 18P09K22I25G, 18P09K22E20W, 18P09K22E10W, 18P09K22E05B, 18P09K22I25S, 18P09K22I25H, 18P09K22I25C, 18P09K22I20X, 18P09K22I15M, 18P09K22I05S, 18P09K22E25H, 18P09K22E20M, 18P09K22E20C, 18P09K22E15M, 18P09K22E20N, 18P09K22M05E, 18P09K22I25J, 18P09K22I05Z, 18P09K22I05U, 18P09K22E25E, 18P09K22E15U, 18P09K22E10J, 18P09K22N01F, 18P09K22J06V, 18P09K22F21Q, 18P09K22N01G, 18P09K22J16R, 18P09K22J16B, 18P09K22F21W, 18P09K22F06R, 18P09K22N01C, 18P09K22J21H, 18P09K22J11X, 18P09K22J11H, 18P09K22J01M, 18P09K22F16H, 18P09K22F11C, 18P09K22N01T, 18P09K22J21I, 18P09K22J16T, 18P09K22J06N, 18P09K22J01Y, 18P09K22J01T, 18P09K22F21N, 18P09K22F21I, 18P09K22F21D, 18P09K22F11I, 18P09K22F06N, 18P09K22N07A, 18P09K22N02F, 18P09K22J21U, 18P09K22J22K, 18P09K22J22A, 18P09K22J12Q, 18P09K22J06J, 18P09K22J07K, 18P09K22F21P, 18P09K22F17V, 18P09K22F16P, 18P09K22J02L, 18P09K22J02G, 18P09K22F22L, 18P09K22F22G, 18P09K22F22B, 18P09K22N02S, 18P09K22N02C, 18P09K22J22M, 18P09K22J02M, 18P09K22N07D, 18P09K22J17N, 18P09K22J12D, 18P09K22F17Y, 18P09K22F07Y, 18P09K22J12Z, 18P09K22J12E, 18P09K22J07P, 18P09K22N03F, 18P09K22J08Q, 18P09K22F18V, 18P09K22F13V, 18P09K22F13K, 18P09K22N03L, 18P09K22J03B, 18P09K22F23R, 18P09K22F23B, 18P09K22J23X, 18P09K22J03C, 18P09K22F18M, 18P09K22J23Y, 18P09K22F23N, 18P09K22F13Y, 18P09K22F23J, 18P09K22N04W, 18P09K22N04B, 18P09K22F19V, 18P09K22J14H, 18P09K22N04N, 18P09K22J14Y, 18P09K22J14N, 18P09K22N09E, 18P09K21L03A, 18P09K21H23V, 18P09K21L09A, 18P09K21L04Q, 18P09K21H24K, 18P09K21H19Q, 18P09K21L09G, 18P09K21L04W, 18P09K21H24W, 18P09K21H24G, 18P09K21L04H, 18P09K21H19S, 18P09K21L09N, 18P09K21L04T, 18P09K21H24D, 18P09K21L09P, 18P09K21H19Z, 18P09K21H14U, 18P09K21L05Q, 18P09K21H15R, 18P09K21H15G, 18P09K21L10N, 18P09K21H20T, 18P09K21H10Y, 18P09K21H25J, 18P09K21H25E, 18P09K21H15P, 18P09K21H10Z, 18P09K22I06K, 18P09K22E11Q, 18P09K22I11L, 18P09K22I06B, 18P09K22I01B, 18P09K22I06H, 18P09K22E21C, 18P09K22I06D, 18P09K22I01Y, 18P09K22I01I, 18P09K22E16I, 18P09K22I06J, 18P09K22E21P, 18P09K22E11Z, 18P09K22E11E, 18P09K22I07A, 18P09K22E17V, 18P09K22E17K, 18P09K22E02Q, 18P09K22I02G, 18P09K22E17L, 18P09K22E12R, 18P09K22E07W, 18P09K22I17I, 18P09K22I12X, 18P09K22I02X, 18P09K22I02T, 18P09K22E22H, 18P09K22E22D, 18P09K22E17S, 18P09K22E17M, 18P09K22E17N, 18P09K22E17I, 18P09K22E12N, 18P09K22E12D, 18P09K22E02S, 18P09K22E02N, 18P09K22E02I, 18P09K22I12P, 18P09K22I12J, 18P09K22E12U, 18P09K22E07Z, 18P09K22E02P, 18P09K22E02J, 18P09K22E02E, 18P09K22I08K, 18P09K22I08R, 18P09K22E23W, 18P09K22E13G, 18P09K22E08G, 18P09K22A23X, 18P09K22A23M, 18P09K22I08Y, 18P09K22E18Y, 18P09K22I18J, 18P09K22I18E, 18P09K22I13U, 18P09K22I13J, 18P09K22I03P, 18P09K22E13U, 18P09K22E13J, 18P09K22E08P, 18P09K22I14V, 18P09K22I14K, 18P09K22I04A, 18P09K22E24Q, 18P09K22E24F, 18P09K22E14K, 18P09K22E14F, 18P09K22A24V, 18P09K22A24Q, 18P09K22I24G, 18P09K22I19R, 18P09K22I04R, 18P09K22E19G, 18P09K22I04X, 18P09K22E09H, 18P09K22A24X, 18P09K22A24M, 18P09K22I19T, 18P09K22I19N, 18P09K22I09Z, 18P09K22E19P, 18P09K22E14J, 18P09K22E09P, 18P09K22A24Y, 18P09K22I25F, 18P09K22I15Q, 18P09K22E20V, 18P09K22E15A, 18P09K22E10F, 18P09K22E05Q, 18P09K22I25W, 18P09K22I20G, 18P09K22I05L, 18P09K22E15L, 18P09K22E15G, 18P09K22E10L, 18P09K22E05L, 18P09K22E25X, 18P09K22E20X, 18P09K22E10H, 18P09K22E05H, 18P09K22I25Y, 18P09K22I25D, 18P09K22I20I, 18P09K22I15T, 18P09K22I10I, 18P09K22I05T, 18P09K22I05I, 18P09K22E15I, 18P09K22E15D, 18P09K22E05N, 18P09K22I25P, 18P09K22I15J, 18P09K22I10U, 18P09K22E10E, 18P09K22J21V, 18P09K22J16K, 18P09K22J16A, 18P09K22J11Q, 18P09K22J11K, 18P09K22F16K, 18P09K22F16F, 18P09K22F06V, 18P09K22F06F, 18P09K22F01V, 18P09K22J21B, 18P09K22F16L, 18P09K22F11R, 18P09K22F01R, 18P09K22N01M, 18P09K22N01H, 18P09K22J11S, 18P09K22J06M, 18P09K22F21H, 18P09K22F16M, 18P09K22F06H, 18P09K22J21N, 18P09K22J16Y, 18P09K22J16D, 18P09K22J11I, 18P09K22F11T, 18P09K22F06I, 18P09K22J22Q, 18P09K22J17A, 18P09K22J11Z, 18P09K22J06U, 18P09K22F22V, 18P09K22F21U, 18P09K22F16Z, 18P09K22F16J, 18P09K22F07Q, 18P09K22N02R, 18P09K22J22W, 18P09K22J22B, 18P09K22J12B, 18P09K22F12B, 18P09K22N02H, 18P09K22J12C, 18P09K22J02X, 18P09K22J02C, 18P09K22F07S, 18P09K22J17I, 18P09K22J12N, 18P09K22J02I, 18P09K22J02D, 18P09K22F12D, 18P09K22N02U, 18P09K22J17J, 18P09K22J17E, 18P09K22J12U, 18P09K22J07U, 18P09K22J02P, 18P09K22F22Z, 18P09K22F17U, 18P09K22F12U, 18P09K22N03A, 18P09K22J13V, 18P09K22J13A, 18P09K22J03A, 18P09K22F23A, 18P09K22F18Q, 18P09K22J13W, 18P09K22J13H, 18P09K22F23X, 18P09K22F23S, 18P09K22F18C, 18P09K22N03D, 18P09K22J23T, 18P09K22J18D, 18P09K22J13Y, 18P09K22J03D, 18P09K22N03U, 18P09K22N03P, 18P09K22N03E, 18P09K22J18J, 18P09K22J18E, 18P09K22F23E, 18P09K22N04G, 18P09K22N04A, 18P09K22J19A, 18P09K22J14V, 18P09K22J14G, 18P09K22F24V, 18P09K22F24B, 18P09K22F19F, 18P09K21L03B, 18P09K21L03X, 18P09K21L03C, 18P09K21H23J, 18P09K21L04R, 18P09K21L04B, 18P09K21L04M, 18P09K21H24S, 18P09K21H24C, 18P09K21H19H, 18P09K21H14X, 18P09K21L04N, 18P09K21L04I, 18P09K21H14Y, 18P09K21L09J, 18P09K21L04E, 18P09K21H24Z, 18P09K21H19P, 18P09K21L05A, 18P09K21H20F, 18P09K21H15V, 18P09K21L10L, 18P09K21L10H, 18P09K21L05G, 18P09K21H20S, 18P09K21H20G, 18P09K21H15X, 18P09K21H15S, 18P09K21H15H, 18P09K21H15B, 18P09K21H15C, 18P09K21L05I, 18P09K21H20N, 18P09K21L15E, 18P09K21L05Z, 18P09K21H25Z, 18P09K21H25U, 18P09K21H25P, 18P09K21H15Z, 18P09K21H15U, 18P09K22I06Q, 18P09K22I06F, 18P09K22I01Q, 18P09K22E16V, 18P09K22E06V, 18P09K22I11G, 18P09K22I06R, 18P09K22I01R, 18P09K22E21R, 18P09K22E21L, 18P09K22E16L, 18P09K22E11W, 18P09K22E06L, 18P09K22I11S, 18P09K22I06C, 18P09K22E16H, 18P09K22E11X, 18P09K22E11S, 18P09K22I11Y, 18P09K22I11I, 18P09K22I11D, 18P09K22I06I, 18P09K22I01N, 18P09K22E21N, 18P09K22E16Y, 18P09K22E11N, 18P09K22E11I, 18P09K22I11P, 18P09K22I06E, 18P09K22E16Z, 18P09K22E11U, 18P09K22I12K, 18P09K22I07V, 18P09K22E22A, 18P09K22I12L, 18P09K22I07R, 18P09K22I07G, 18P09K22I02B, 18P09K22E12W, 18P09K22E07B, 18P09K22E02L, 18P09K22I17D, 18P09K22I12Y, 18P09K22I12T, 18P09K22I12D, 18P09K22I07Y, 18P09K22I02Y, 18P09K22I02N, 18P09K22I02C, 18P09K22E22C, 18P09K22E17Y, 18P09K22E17D, 18P09K22E12M, 18P09K22I12Z, 18P09K22E07U, 18P09K22I18F, 18P09K22I13F, 18P09K22I03A, 18P09K22E03Q, 18P09K22I18R, 18P09K22I03B, 18P09K22E13W, 18P09K22I18C, 18P09K22I13C, 18P09K22I03X, 18P09K22E23M, 18P09K22E03H, 18P09K22I18N, 18P09K22I18D, 18P09K22I13Y, 18P09K22I13I, 18P09K22E23T, 18P09K22E23N, 18P09K22E23D, 18P09K22E13D, 18P09K22E08D, 18P09K22E03I, 18P09K22A23Y, 18P09K22I18U, 18P09K22I18P, 18P09K22I13P, 18P09K22E23P, 18P09K22E03P, 18P09K22E03E, 18P09K22I19F, 18P09K22I19A, 18P09K22I09Q, 18P09K22A24F, 18P09K22I24L, 18P09K22E24W, 18P09K22E19R, 18P09K22E19L, 18P09K22E09L, 18P09K22I14X, 18P09K22I09M, 18P09K22E24S, 18P09K22E19S, 18P09K22I24J, 18P09K22I09U, 18P09K22I09J, 18P09K22I04U, 18P09K22I04E, 18P09K22E24N, 18P09K22E19N, 18P09K22E14I, 18P09K22E14D, 18P09K22E09U, 18P09K22E09N, 18P09K22E09I, 18P09K22E09D, 18P09K22E04P, 18P09K22E04D, 18P09K22A24P, 18P09K22I10F, 18P09K22E15V, 18P09K22I20W, 18P09K22I20R, 18P09K22I20L, 18P09K22I15L, 18P09K22I10B, 18P09K22I05W, 18P09K22E25L, 18P09K22E20R, 18P09K22E20G, 18P09K22E10G, 18P09K22I25M, 18P09K22I20S, 18P09K22I20M, 18P09K22E15S, 18P09K22E15H, 18P09K22E10C, 18P09K22I20N, 18P09K22I15D, 18P09K22I05N, 18P09K22E20T, 18P09K22E10I, 18P09K22M05J, 18P09K22I25Z, 18P09K22I10J, 18P09K22E10Z, 18P09K22J21A, 18P09K22J16F, 18P09K22J01V, 18P09K22F21K, 18P09K22F16V, 18P09K22F11V, 18P09K22F06K, 18P09K22J11W, 18P09K22J11L, 18P09K22J06L, 18P09K22J01L, 18P09K22J01G, 18P09K22F06W, 18P09K22F06L, 18P09K22N01S, 18P09K22J21X, 18P09K22J16M, 18P09K22J11M, 18P09K22J06C, 18P09K22J01C, 18P09K22F16C, 18P09K22J16I, 18P09K22J06Y, 18P09K22F16D, 18P09K22F06Y, 18P09K22F06D, 18P09K22N01P, 18P09K22N02A, 18P09K22J17V, 18P09K22J17K, 18P09K22J12V, 18P09K22J11U, 18P09K22J12K, 18P09K22J06Z, 18P09K22J07A, 18P09K22J02V, 18P09K22J02F, 18P09K22F21E, 18P09K22F12Q, 18P09K22N02W, 18P09K22J22L, 18P09K22J17B, 18P09K22F17R, 18P09K22F07R, 18P09K22J22H, 18P09K22J07M, 18P09K22J07H, 18P09K22F22M, 18P09K22F17H, 18P09K22F17C, 18P09K22N02T, 18P09K22J02T, 18P09K22F22Y, 18P09K22F17T, 18P09K22F12Y, 18P09K22N02J, 18P09K22F17P, 18P09K22F12Z, 18P09K22F12E, 18P09K22N03K, 18P09K22J23K, 18P09K22J13K, 18P09K22J08V, 18P09K22J03K, 18P09K22J03F, 18P09K22F18F, 18P09K22N03R, 18P09K22N03B, 18P09K22J23R, 18P09K22J18G, 18P09K22F18L, 18P09K22F18G, 18P09K22F18B, 18P09K22J13X, 18P09K22J13C, 18P09K22F18S, 18P09K22J13T, 18P09K22F18Y, 18P09K22J13P, 18P09K22J13J, 18P09K22F23P, 18P09K22F18P, 18P09K22J19F, 18P09K22J19B, 18P09K22J14K, 18P09K22N04S, 18P09K22J19D, 18P09K22J14U, 18P09K22J14P, 18P09K21L03S, 18P09K21L03H, 18P09K21H23X, 18P09K21L03T, 18P09K21L03N, 18P09K21H23U, 18P09K21L04V, 18P09K21H24F, 18P09K21H24L, 18P09K21H19L, 18P09K21L09I, 18P09K21L09D, 18P09K21L04D, 18P09K21H19T, 18P09K21L04Z, 18P09K21L04J, 18P09K21H24J, 18P09K21H24E, 18P09K21H25A, 18P09K21H20Q, 18P09K21H20K, 18P09K21L10W, 18P09K21L10X, 18P09K21L10R, 18P09K21L10S, 18P09K21L10G, 18P09K21L05X, 18P09K21L05L, 18P09K21H25L, 18P09K21H25B, 18P09K21H15W, 18P09K21L15I, 18P09K21L15D, 18P09K21L05Y, 18P09K21H25I, 18P09K21H20I, 18P09K21L05J, 18P09K21H20P, 18P09K21H15E, 18P09K22I11K, 18P09K22I11A, 18P09K22E11K, 18P09K22E06A, 18P09K22I06W, 18P09K22E16G, 18P09K22E16B, 18P09K22E11R, 18P09K22E06H, 18P09K22E01X, 18P09K22I06Y, 18P09K22E16T, 18P09K22E06I, 18P09K22I11J, 18P09K22E21Z, 18P09K22E21U, 18P09K22E21J, 18P09K22E16E, 18P09K22E06E, 18P09K22E01U, 18P09K22I12A, 18P09K22I02A, 18P09K22E22K, 18P09K22E17F, 18P09K22E12Q, 18P09K22E07Q, 18P09K22E07F, 18P09K22I12W, 18P09K22I07B, 18P09K22E12G, 18P09K22I12M, 18P09K22I07C, 18P09K22E22Y, 18P09K22E22I, 18P09K22E12S, 18P09K22E12T, 18P09K22E07D, 18P09K22E02X, 18P09K22E02T, 18P09K22I07Z, 18P09K22I07E, 18P09K22I02U, 18P09K22I02J, 18P09K22E22Z, 18P09K22E22U, 18P09K22E12E, 18P09K22I13K, 18P09K22E23V, 18P09K22E18V, 18P09K22E03A, 18P09K22I18L, 18P09K22I13W, 18P09K22I08W, 18P09K22I08B, 18P09K22I03R, 18P09K22I03G, 18P09K22E03R, 18P09K22E23H, 18P09K22E18S, 18P09K22E03S, 18P09K22I13T, 18P09K22I08D, 18P09K22E18I, 18P09K22E03Y, 18P09K22E18J, 18P09K22A23Z, 18P09K22I24A, 18P09K22I19Q, 18P09K22I14A, 18P09K22I04F, 18P09K22E24A, 18P09K22E19F, 18P09K22E09Q, 18P09K22E04V, 18P09K22E04F, 18P09K22I14W, 18P09K22I14B, 18P09K22I09L, 18P09K22E24L, 18P09K22E24G, 18P09K22E19B, 18P09K22E14L, 18P09K22E14B, 18P09K22E04W, 18P09K22E04B, 18P09K22A24W, 18P09K22A24L, 18P09K22I14C, 18P09K22I09S, 18P09K22I09C, 18P09K22I04C, 18P09K22E24M, 18P09K22E19M, 18P09K22E14S, 18P09K22E14H, 18P09K22E04S, 18P09K22E04M, 18P09K22I24U, 18P09K22I24E, 18P09K22I19P, 18P09K22I19D, 18P09K22I14P, 18P09K22I09N, 18P09K22I09P, 18P09K22I04P, 18P09K22I04D, 18P09K22E24T, 18P09K22E24D, 18P09K22E19U, 18P09K22E14Y, 18P09K22E09Y, 18P09K22E04Y, 18P09K22E04E, 18P09K22I25A, 18P09K22I10V, 18P09K22E25V, 18P09K22E15Q, 18P09K22A25V, 18P09K22I25R, 18P09K22I25L, 18P09K22I15W, 18P09K22I10G, 18P09K22I05R, 18P09K22I05G, 18P09K22E20B, 18P09K22E15R, 18P09K22I25X, 18P09K22I15C, 18P09K22I10X, 18P09K22I10H, 18P09K22I05M, 18P09K22I05C, 18P09K22E10X, 18P09K22E05C, 18P09K22I25N, 18P09K22I20D, 18P09K22I15Y, 18P09K22I15I, 18P09K22E15N, 18P09K22I15Z, 18P09K22E25J, 18P09K22E20P, 18P09K22E15J, 18P09K22E05U, 18P09K22E05P, 18P09K22F16A, 18P09K22F11Q, 18P09K22F01Q, 18P09K22N01B, 18P09K22J01B, 18P09K22F21B, 18P09K22F11B, 18P09K22F06G, 18P09K22J21M, 18P09K22J21C, 18P09K22J11C, 18P09K22J01X, 18P09K22J01H, 18P09K22F21M, 18P09K22F06M, 18P09K22J21Y, 18P09K22F21Y, 18P09K22F21T, 18P09K22F16Y, 18P09K22F16N, 18P09K22F16I, 18P09K22J21Z, 18P09K22J22V, 18P09K22J21P, 18P09K22J22F, 18P09K22J11P, 18P09K22J11J, 18P09K22J01Z, 18P09K22J01P, 18P09K22J01E, 18P09K22F17K, 18P09K22F11U, 18P09K22F07V, 18P09K22F06U, 18P09K22F07K, 18P09K22N02L, 18P09K22J22G, 18P09K22J17W, 18P09K22J12W, 18P09K22J02R, 18P09K22J22X, 18P09K22J17C, 18P09K22J12H, 18P09K22J02S, 18P09K22F17X, 18P09K22F17S, 18P09K22N02Y, 18P09K22J22Y, 18P09K22J12I, 18P09K22J07T, 18P09K22J07I, 18P09K22F12T, 18P09K22N02P, 18P09K22F22U, 18P09K22F22J, 18P09K22J13F, 18P09K22N03W, 18P09K22N03G, 18P09K22J13L, 18P09K22J08W, 18P09K22J03G, 18P09K22F23L, 18P09K22N03S, 18P09K22J18H, 18P09K22F13X, 18P09K22N04K, 18P09K22N04F, 18P09K22J24V, 18P09K22J14A, 18P09K22F24A, 18P09K22F19Q, 18P09K22F19L, 18P09K22N04X, 18P09K22J14T, 18P09K21H23S, 18P09K21L03Y, 18P09K21L03U, 18P09K21L09B, 18P09K21H24R, 18P09K21L04S, 18P09K21L04C, 18P09K21H24H, 18P09K21L04Y, 18P09K21L04P, 18P09K21L05K, 18P09K21L05F, 18P09K21H25V, 18P09K21H25Q, 18P09K21L10B, 18P09K21L05M, 18P09K21L05H, 18P09K21L05B, 18P09K21H25M, 18P09K21H25G, 18P09K21H20L, 18P09K21H10X, 18P09K21L10T, 18P09K21L10D, 18P09K21L05D, 18P09K21H25Y, 18P09K21H15I, 18P09K21H20U, 18P09K21H20E, 18P09K21H10P, 18P09K22I06V, 18P09K22I01F, 18P09K22I01A, 18P09K22E21K, 18P09K22E21F, 18P09K22E16Q, 18P09K22E11A, 18P09K22E01V, 18P09K22I11B, 18P09K22E06W, 18P09K22E16S, 18P09K22E16M, 18P09K22E11C, 18P09K22E06X, 18P09K22E01S, 18P09K22I06N, 18P09K22E21I, 18P09K22E21D, 18P09K22E16N, 18P09K22E11Y, 18P09K22E06N, 18P09K22I06P, 18P09K22I01U, 18P09K22I01E, 18P09K22E06U, 18P09K22E01Z, 18P09K22I17A, 18P09K22I07K, 18P09K22I02V, 18P09K22I02F, 18P09K22E22V, 18P09K22E22Q, 18P09K22E17Q, 18P09K22E12V, 18P09K22E07A, 18P09K22E22G, 18P09K22E07R, 18P09K22E07L, 18P09K22E07G, 18P09K22I17H, 18P09K22I12N, 18P09K22I07S, 18P09K22I07D, 18P09K22I02H, 18P09K22I02D, 18P09K22E22S, 18P09K22E22T, 18P09K22E22N, 18P09K22E12Y, 18P09K22E07N, 18P09K22E07H, 18P09K22E07C, 18P09K22E02M, 18P09K22I02Z, 18P09K22I02P, 18P09K22E17P, 18P09K22E12Z, 18P09K22E12J, 18P09K22E02U, 18P09K22I18Q, 18P09K22I18K, 18P09K22I13V, 18P09K22I03V, 18P09K22I03Q, 18P09K22E23F, 18P09K22E13K, 18P09K22A23V, 18P09K22I18W, 18P09K22I08G, 18P09K22I03L, 18P09K22E23R, 18P09K22E23B, 18P09K22E08W, 18P09K22E08R, 18P09K22E08L, 18P09K22A23W, 18P09K22I13X, 18P09K22I13S, 18P09K22I03C, 18P09K22E23X, 18P09K22E18C, 18P09K22E13S, 18P09K22E03M, 18P09K22A23S, 18P09K22I18Y, 18P09K22I08T, 18P09K22I08N, 18P09K22E18D, 18P09K22E13N, 18P09K22A23T, 18P09K22I03Z, 18P09K22E18P, 18P09K22E13Z, 18P09K22E08E, 18P09K22E03U, 18P09K22A23U, 18P09K22I19V, 18P09K22I19K, 18P09K22I09V, 18P09K22E19Q, 18P09K22E09A, 18P09K22I19G, 18P09K22I19B, 18P09K22I09W, 18P09K22I04L, 18P09K22E04L, 18P09K22I24C, 18P09K22I19S, 18P09K22I14H, 18P09K22I04M, 18P09K22E24C, 18P09K22E19H, 18P09K22E09S, 18P09K22A24S, 18P09K22I24I, 18P09K22I14J, 18P09K22I14D, 18P09K22I09T, 18P09K22I09I, 18P09K22I04T, 18P09K22I04I, 18P09K22E19Y, 18P09K22E19Z, 18P09K22E19I, 18P09K22E14N, 18P09K22E04T, 18P09K22E04I, 18P09K22I20Q, 18P09K22I10A, 18P09K22I05F, 18P09K22I05A, 18P09K22E25K, 18P09K22E20K, 18P09K22E10K, 18P09K22E10A, 18P09K22E05F, 18P09K22A25Q, 18P09K22M05B, 18P09K22I10L, 18P09K22I05B, 18P09K22E10B, 18P09K22E05W, 18P09K22I20H, 18P09K22I10S, 18P09K22I10M, 18P09K22I25I, 18P09K22I20T, 18P09K22I10T, 18P09K22I10D, 18P09K22E25Y, 18P09K22E25N, 18P09K22E25D, 18P09K22E20I, 18P09K22E15T, 18P09K22E10D, 18P09K22E05T, 18P09K22I15E, 18P09K22I05P, 18P09K22I05J, 18P09K22E25U, 18P09K22E20U, 18P09K22E10P, 18P09K22N01K, 18P09K22J21Q, 18P09K22J21K, 18P09K22J21F, 18P09K22J01K, 18P09K22J01F, 18P09K22F21A, 18P09K22F11A, 18P09K22N01L, 18P09K22J21W, 18P09K22J21L, 18P09K22J21G, 18P09K22J11G, 18P09K22F11L, 18P09K22F11G, 18P09K22F06B, 18P09K22J16H, 18P09K22F06C, 18P09K22N01N, 18P09K22N01I, 18P09K22J21T, 18P09K22J21D, 18P09K22J16N, 18P09K22J06T, 18P09K22J06D, 18P09K22J01N, 18P09K22F16T, 18P09K22F11N, 18P09K22F11D, 18P09K22N01U, 18P09K22J16U, 18P09K22J16P, 18P09K22J17Q, 18P09K22J11E, 18P09K22J06E, 18P09K22F22F, 18P09K22F16U, 18P09K22F12K, 18P09K22F11J, 18P09K22F12F, 18P09K22F06Z, 18P09K22N02G, 18P09K22J17R, 18P09K22J07B, 18P09K22F17L, 18P09K22N07C, 18P09K22N02M, 18P09K22J17S, 18P09K22J17M, 18P09K22J07S, 18P09K22F17M, 18P09K22F12S, 18P09K22F12H, 18P09K22N02D, 18P09K22J22T, 18P09K22J12T, 18P09K22F17N, 18P09K22F17D, 18P09K22J22J, 18P09K22J12J, 18P09K22F22P, 18P09K22F12J, 18P09K22J23Q, 18P09K22J18K, 18P09K22J18A, 18P09K22F23Q, 18P09K22F18A, 18P09K22F13Q, 18P09K22J23L, 18P09K22J13R, 18P09K22F13W, 18P09K22F13L, 18P09K22N03H, 18P09K22J03H, 18P09K22F13S, 18P09K22N03N, 18P09K22J18I, 18P09K22J13D, 18P09K22F18N, 18P09K22F18D, 18P09K22N03J, 18P09K22F13Z, 18P09K22J19G, 18P09K22J14Q, 18P09K22J14F, 18P09K22F24F, 18P09K22J14X, 18P09K22N09D, 18P09K22N04Y, 18P09K21H23N, 18P09K21H23I, 18P09K21L03J, 18P09K21H24V, 18P09K21H24Q, 18P09K21L04X, 18P09K21H19M, 18P09K21H19C, 18P09K21H19Y, 18P09K21H19I, 18P09K21H14T, 18P09K21H24P, 18P09K21H19E, 18P09K21L05V, 18P09K21H15K, 18P09K21H25X, 18P09K21H20R, 18P09K21H20B, 18P09K21L10I, 18P09K21H20Y, 18P09K21H15Y, 18P09K21H15D, 18P09K21H10T, 18P09K21L10U, 18P09K21L10P, 18P09K21L05P, 18P09K21L05E, 18P09K21H15J, 18P09K22I11F, 18P09K22I01K, 18P09K22E21Q, 18P09K22E11V, 18P09K22E11F, 18P09K22E06Q, 18P09K22E06F, 18P09K22I06L, 18P09K22E21W, 18P09K22E11G, 18P09K22E11B, 18P09K22E06B, 18P09K22I01S, 18P09K22I01M, 18P09K22I01C, 18P09K22E11M, 18P09K22E06S, 18P09K22E06C, 18P09K22E11T, 18P09K22E06T, 18P09K22E01T, 18P09K22E16P, 18P09K22E11P, 18P09K22E01P, 18P09K22I12Q, 18P09K22I07F, 18P09K22E22F, 18P09K22E12F, 18P09K22E07K, 18P09K22E02K, 18P09K22I17G, 18P09K22I12R, 18P09K22I12B, 18P09K22E22L, 18P09K22E22B, 18P09K22I02S, 18P09K22E07Y, 18P09K22E07M, 18P09K22E07I, 18P09K22I17E, 18P09K22E17Z, 18P09K22E17U, 18P09K22E12P, 18P09K22E07P, 18P09K22E07J, 18P09K22I03K, 18P09K22I03F, 18P09K22E18Q, 18P09K22E13V, 18P09K22E13Q, 18P09K22E08F, 18P09K22I13L, 18P09K22I13G, 18P09K22I08L, 18P09K22E18R, 18P09K22E13R, 18P09K22E13B, 18P09K22E08B, 18P09K22I18M, 18P09K22I13H, 18P09K22I08M, 18P09K22I03H, 18P09K22E18M, 18P09K22E08S, 18P09K22E08M, 18P09K22E03C, 18P09K22I23D, 18P09K22I18I, 18P09K22I08I, 18P09K22I03N, 18P09K22E13T, 18P09K22E03N, 18P09K22A23N, 18P09K22I18Z, 18P09K22I08U, 18P09K22I08P, 18P09K22I03U, 18P09K22E23U, 18P09K22E18Z, 18P09K22E13P, 18P09K22E08J, 18P09K22A23P, 18P09K22I14F, 18P09K22I04V, 18P09K22I04Q, 18P09K22E24K, 18P09K22E19K, 18P09K22E09K, 18P09K22E04K, 18P09K22E04A, 18P09K22I19W, 18P09K22I09G, 18P09K22I04B, 18P09K22E04G, 18P09K22I19M, 18P09K22I24P, 18P09K22I24D, 18P09K22I19U, 18P09K22I19J, 18P09K22I14Z, 18P09K22I14E, 18P09K22I04N, 18P09K22I04J, 18P09K22E24Y, 18P09K22E24E, 18P09K22E14T, 18P09K22E14U, 18P09K22E14P, 18P09K22E09T, 18P09K22E04U, 18P09K22E04J, 18P09K22A24T, 18P09K22A24Z, 18P09K22I20K, 18P09K22I15V, 18P09K22E20A, 18P09K22I25B, 18P09K22I20B, 18P09K22E20L, 18P09K22E05G, 18P09K22I20C, 18P09K22I15X, 18P09K22I05H, 18P09K22E15X, 18P09K22E15C, 18P09K22E10S, 18P09K22E05X, 18P09K22E05S, 18P09K22E05M, 18P09K22M05I, 18P09K22I20Y, 18P09K22I10Y, 18P09K22I05Y, 18P09K22E25T, 18P09K22I25U, 18P09K22I10Z, 18P09K22I10P, 18P09K22E25P, 18P09K22E20J, 18P09K22E10U, 18P09K22J16V, 18P09K22J11V, 18P09K22F21V, 18P09K22F21F, 18P09K22F11K, 18P09K22N01R, 18P09K22J06R, 18P09K22J06B, 18P09K22J01W, 18P09K22F21G, 18P09K22F16R, 18P09K22F16G, 18P09K22F01W, 18P09K22F21X, 18P09K22F21S, 18P09K22F21C, 18P09K22F16S, 18P09K22F11S, 18P09K22F01X, 18P09K22J11N, 18P09K22N01Z, 18P09K22N02K, 18P09K22N01E, 18P09K22J17F, 18P09K22J06P, 18P09K22J01J, 18P09K22F22K, 18P09K22F22A, 18P09K22F17Q, 18P09K22F17F, 18P09K22F17A, 18P09K22F06P, 18P09K22J17G, 18P09K22J07W, 18P09K22J07G, 18P09K22J02B, 18P09K22F17W, 18P09K22F17G, 18P09K22F12L, 18P09K22N02X, 18P09K22J07C, 18P09K22F22S, 18P09K22F22H, 18P09K22F12M, 18P09K22F12C, 18P09K22J02N, 18P09K22N02Z, 18P09K22J02U, 18P09K22F22E, 18P09K22J23V, 18P09K22J18F, 18P09K22J13Q, 18P09K22F23V, 18P09K22J23W, 18P09K22J18B, 18P09K22F18R, 18P09K22F13R, 18P09K22J13M, 18P09K22J08X, 18P09K22J13N, 18P09K22J13I, 18P09K22F23T, 18P09K22F23I, 18P09K22F23D, 18P09K22F18T, 18P09K22J13U, 18P09K22F23U, 18P09K22J14R, 18P09K22F19W, 18P09K22F19G, 18P09K22J19C, 18P09K22N04I, 18P09K22J15F, 18P09K21L03F, 18P09K21L03G, 18P09K21L03M, 18P09K21L03I, 18P09K21H23T, 18P09K21L09F, 18P09K21L04K, 18P09K21H19F, 18P09K21L04L, 18P09K21L04G, 18P09K21H19W, 18P09K21H19B, 18P09K21L09M, 18P09K21H24Y, 18P09K21H19U, 18P09K21H14Z, 18P09K21H15A, 18P09K21L15C, 18P09K21L05C, 18P09K21H25W, 18P09K21H25S, 18P09K21H20W, 18P09K21H20M, 18P09K21H20C, 18P09K21L05N, 18P09K21H10N, 18P09K21L10J, 18P09K21L05U, 18P09K21H10U, 18P09K22E21A, 18P09K22E16F, 18P09K22E16A, 18P09K22E06K, 18P09K22I01L, 18P09K22I11H, 18P09K22I06X, 18P09K22I01H, 18P09K22E21S, 18P09K22E21M, 18P09K22E21H, 18P09K22E11H, 18P09K22I06T, 18P09K22I01T, 18P09K22E11D, 18P09K22E06Y, 18P09K22I01J, 18P09K22E21E, 18P09K22E06P, 18P09K22E07V, 18P09K22I07L, 18P09K22I02W, 18P09K22I02R, 18P09K22E17W, 18P09K22E17B, 18P09K22I12S, 18P09K22I12H, 18P09K22I12I, 18P09K22I07X, 18P09K22I07M, 18P09K22I07H, 18P09K22E22M, 18P09K22E17X, 18P09K22E17C, 18P09K22E12X, 18P09K22E12I, 18P09K22E07X, 18P09K22E02Y, 18P09K22I02E, 18P09K22E17E, 18P09K22I08A, 18P09K22E23Q, 18P09K22E23A, 18P09K22E18A, 18P09K22E08K, 18P09K22E08A, 18P09K22E03F, 18P09K22E23G, 18P09K22E18G, 18P09K22E18B, 18P09K22E13L, 18P09K22A23R, 18P09K22I18H, 18P09K22I08X, 18P09K22I03S, 18P09K22E23S, 18P09K22E13X, 18P09K22E13M, 18P09K22E08X, 18P09K22E08C, 18P09K22E03X, 18P09K22I18T, 18P09K22I03T, 18P09K22I03D, 18P09K22E08N, 18P09K22I23E, 18P09K22I08J, 18P09K22I03E, 18P09K22E23Z, 18P09K22E23E, 18P09K22E18U, 18P09K22E13E, 18P09K22E08U, 18P09K22A23J, 18P09K22I24F, 18P09K22I14Q, 18P09K22I09A, 18P09K22I04K, 18P09K22E19V, 18P09K22E14V, 18P09K22E14Q, 18P09K22E04Q, 18P09K22I04G, 18P09K22E24B, 18P09K22E14R, 18P09K22E09W, 18P09K22E04R, 18P09K22I19X, 18P09K22I19C, 18P09K22I09H, 18P09K22E19X, 18P09K22E14M, 18P09K22A24H, 18P09K22I24N, 18P09K22I19Y, 18P09K22I19I, 18P09K22I14T, 18P09K22I09D, 18P09K22I09E, 18P09K22E24Z, 18P09K22E24U, 18P09K22E24J, 18P09K22E14Z, 18P09K22E14E, 18P09K22E04Z, 18P09K22A24N, 18P09K22I25V, 18P09K22I25K, 18P09K22I10K, 18P09K22I05K, 18P09K22E25F, 18P09K22E25A, 18P09K22E15F, 18P09K22E05A, 18P09K22I15R, 18P09K22I15B, 18P09K22I10W, 18P09K22I10R, 18P09K22E25R, 18P09K22E15B, 18P09K22A25W, 18P09K22M05C, 18P09K22E25S, 18P09K22E25M, 18P09K22E25C, 18P09K22E20H, 18P09K22E10M, 18P09K22M05D, 18P09K22I25T, 18P09K22I15N, 18P09K22E20Y, 18P09K22E20D, 18P09K22E10Y, 18P09K22E05Y, 18P09K22I20U, 18P09K22I20J, 18P09K22I20E, 18P09K22I15U, 18P09K22I10E, 18P09K22E25Z, 18P09K22E20Z, 18P09K22E05Z, 18P09K22J06Q, 18P09K22J01A, 18P09K22F11F, 18P09K22F06A, 18P09K22J16L, 18P09K22J11R, 18P09K22J11B, 18P09K22J01R, 18P09K22F21R, 18P09K22F21L, 18P09K22F16W, 18P09K22F16B, 18P09K22F11W, 18P09K22J16S, 18P09K22J06S, 18P09K22J06H, 18P09K22F16X, 18P09K22J11Y, 18P09K22J11D, 18P09K22J01I, 18P09K22N02Q, 18P09K22N01J, 18P09K22J21E, 18P09K22J16J, 18P09K22J12A, 18P09K22J07V, 18P09K22J01U, 18P09K22J02K, 18P09K22J02A, 18P09K22F16E, 18P09K22F11Z, 18P09K22F12V, 18P09K22F11P, 18P09K22N07B, 18P09K22J17L, 18P09K22J12R, 18P09K22J12L, 18P09K22F22R, 18P09K22F17B, 18P09K22J07X, 18P09K22J02H, 18P09K22F22X, 18P09K22F07X, 18P09K22N02N, 18P09K22N02I, 18P09K22J22N, 18P09K22J22I, 18P09K22J17T, 18P09K22J07D, 18P09K22F22T, 18P09K22F22N, 18P09K22F22D, 18P09K22F17I, 18P09K22F12N, 18P09K22N02E, 18P09K22J22U, 18P09K22J22P, 18P09K22J17P, 18P09K22J12P, 18P09K22J07Z, 18P09K22F17Z, 18P09K22F17E, 18P09K22F12P, 18P09K22F23F, 18P09K22F18K, 18P09K22F13F, 18P09K22J13B, 18P09K22F23W, 18P09K22F23G, 18P09K22F18W, 18P09K22N03M, 18P09K22J18C, 18P09K22F23H, 18P09K22F23Z, 18P09K22F18Z, 18P09K22F18J, 18P09K22F18E, 18P09K22N04R, 18P09K22N04L, 18P09K22J14L, 18P09K22F24K, 18P09K22F19A, 18P09K22N04M, 18P09K22N04H, 18P09K22N04C, 18P09K22J14J, 18P09K21L02P, 18P09K21L02J, 18P09K21L03R, 18P09K21L03K, 18P09K21H23W, 18P09K21H23R, 18P09K21L03D, 18P09K21H23Y, 18P09K21L08E, 18P09K21L03Z, 18P09K21L03P, 18P09K21L03E, 18P09K21L04F, 18P09K21H19R, 18P09K21L09H, 18P09K21H24X, 18P09K21H24T, 18P09K21H24N, 18P09K21H19N, 18P09K21L09E, 18P09K21H14P, 18P09K21L10V, 18P09K21L10Q, 18P09K21L10A, 18P09K21H20V, 18P09K21H20A, 18P09K21H15Q, 18P09K21L10M, 18P09K21L10C, 18P09K21L05W, 18P09K21L05R, 18P09K21H25R, 18P09K21H25H, 18P09K21H20X, 18P09K21H20H, 18P09K21H15M, 18P09K21H25T, 18P09K21H25D, 18P09K21H20D, 18P09K21H15N, 18P09K21L15J, 18P09K21H20J, 18P09K21H10J, 18P09K21H10E, 18P09K22I01V, 18P09K22E16K, 18P09K22I06G, 18P09K22I01W, 18P09K22E21B, 18P09K22E16R, 18P09K22E06R, 18P09K22E06G, 18P09K22I11M, 18P09K22I11C, 18P09K22I06S, 18P09K22I06M, 18P09K22I01X, 18P09K22E16X, 18P09K22E16C, 18P09K22I11N, 18P09K22E21Y, 18P09K22E01Y, 18P09K22I11Z, 18P09K22I06Z, 18P09K22I06U, 18P09K22I01Z, 18P09K22E16J, 18P09K22E11J, 18P09K22E06Z, 18P09K22E06J, 18P09K22I02Q, 18P09K22I02K, 18P09K22E12A, 18P09K22I17B, 18P09K22I12G, 18P09K22E22W, 18P09K22E17R, 18P09K22E12L, 18P09K22E12B, 18P09K22E02W, 18P09K22E02R, 18P09K22I17N, 18P09K22I17C, 18P09K22I12C, 18P09K22I07T, 18P09K22I07I, 18P09K22I02I, 18P09K22E22X, 18P09K22E12C, 18P09K22E07S, 18P09K22E07T, 18P09K22I12U, 18P09K22I12E, 18P09K22I07U, 18P09K22I07P, 18P09K22I07J, 18P09K22E22J, 18P09K22E22E, 18P09K22I08Q, 18P09K22E23K, 18P09K22E18K, 18P09K22E13A, 18P09K22E08V, 18P09K22E03V, 18P09K22I18B, 18P09K22I13R, 18P09K22E18L, 18P09K22E03L, 18P09K22E03B, 18P09K22I18X, 18P09K22I18S, 18P09K22I13M, 18P09K22I03M, 18P09K22E18H, 18P09K22E13H, 18P09K22E13C, 18P09K22E08H, 18P09K22I13D, 18P09K22I03I, 18P09K22E18T, 18P09K22E18N, 18P09K22E13Y, 18P09K22E08Y, 18P09K22I13E, 18P09K22I08Z, 18P09K22I08E, 18P09K22I03J, 18P09K22E18E, 18P09K22E08Z, 18P09K22E03Z, 18P09K22E03J, 18P09K22I09K, 18P09K22A24K, 18P09K22I24B, 18P09K22I14R, 18P09K22I14G, 18P09K22I09R, 18P09K22I04W, 18P09K22E14W, 18P09K22E14G, 18P09K22E09B, 18P09K22A24R, 18P09K22A24G, 18P09K22I24M, 18P09K22I24H, 18P09K22I19H, 18P09K22I14S, 18P09K22I04H, 18P09K22E24X, 18P09K22E24H, 18P09K22E14X, 18P09K22E14C, 18P09K22E09C, 18P09K22E04X, 18P09K22E04H, 18P09K22I24Z, 18P09K22I19E, 18P09K22I14U, 18P09K22I14N, 18P09K22I09Y, 18P09K22I04Z, 18P09K22E19T, 18P09K22E19J, 18P09K22E19D, 18P09K22E19E, 18P09K22E09Z, 18P09K22E09J, 18P09K22E09E, 18P09K22E04N, 18P09K22A24U, 18P09K22I20F, 18P09K22I20A, 18P09K22I15K, 18P09K22I15F, 18P09K22I15A, 18P09K22E25Q, 18P09K22E20Q, 18P09K22E20F, 18P09K22E15K, 18P09K22E10Q, 18P09K22E05V, 18P09K22I15G, 18P09K22E25W, 18P09K22E25G, 18P09K22E25B, 18P09K22E15W, 18P09K22E10R, 18P09K22E05R, 18P09K22I15S, 18P09K22I15H, 18P09K22I10C, 18P09K22I05X, 18P09K22E20S, 18P09K22I10N, 18P09K22I05D, 18P09K22E25I, 18P09K22E15Y, 18P09K22E10T, 18P09K22E10N, 18P09K22E05I, 18P09K22M05P, 18P09K22I25E, 18P09K22I20Z, 18P09K22I20P, 18P09K22I15P, 18P09K22I05E, 18P09K22E20E, 18P09K22E15Z, 18P09K22E15P, 18P09K22E15E, 18P09K22N01A, 18P09K22J16Q, 18P09K22J11F, 18P09K22J11A, 18P09K22J06K, 18P09K22J06F, 18P09K22J06A, 18P09K22J01Q, 18P09K22F16Q, 18P09K22F06Q, 18P09K22J21R, 18P09K22J16W, 18P09K22J16G, 18P09K22J06W, 18P09K22J06G, 18P09K22N01X, 18P09K22J21S, 18P09K22J16X, 18P09K22J16C, 18P09K22J06X, 18P09K22J01S, 18P09K22F11X, 18P09K22F11M, 18P09K22F11H, 18P09K22F06X, 18P09K22F06S, 18P09K22N01Y, 18P09K22N01D, 18P09K22J11T, 18P09K22J06I, 18P09K22J01D, 18P09K22F11Y, 18P09K22F06T, 18P09K22N02V, 18P09K22J21J, 18P09K22J16Z, 18P09K22J16E, 18P09K22J12F, 18P09K22J07Q, 18P09K22J07F, 18P09K22J02Q, 18P09K22F21Z, 18P09K22F22Q, 18P09K22F21J, 18P09K22F11E, 18P09K22F12A, 18P09K22F06J, 18P09K22N02B, 18P09K22J22R, 18P09K22J12G, 18P09K22J07R, 18P09K22J07L, 18P09K22J02W, 18P09K22F22W, 18P09K22F12W, 18P09K22F12R, 18P09K22F12G, 18P09K22F07W, 18P09K22J22S, 18P09K22J17H, 18P09K22J12X, 18P09K22J12S, 18P09K22J12M, 18P09K22F22C, 18P09K22F12X, 18P09K22J17D, 18P09K22J12Y, 18P09K22J07Y, 18P09K22J07N, 18P09K22J02Y, 18P09K22F22I, 18P09K22F12I, 18P09K22J22Z, 18P09K22J02J, 18P09K22J02E, 18P09K22F17J, 18P09K22N03V, 18P09K22N03Q, 18P09K22F23K, 18P09K22J13G, 18P09K22N03C, 18P09K22J23S, 18P09K22J13S, 18P09K22F23M, 18P09K22F23C, 18P09K22F18X, 18P09K22F18H, 18P09K22N03T, 18P09K22N03I, 18P09K22F23Y, 18P09K22F18I, 18P09K22J23Z, 18P09K22J13Z, 18P09K22J13E, 18P09K22F18U, 18P09K22N04Q, 18P09K22J14W, 18P09K22F24Q, 18P09K22F19R, 18P09K22F19K, 18P09K22J19H, 18P09K22J14S, 18P09K22J14M, 18P09K22N04T, 18P09K22J14I, 18P09K22N04Z"]
    },
    {
      NombreArea: "508678",
      Referencia: "18P09K04J01A",
      Celdas: ["18P09K04J01A, 18P09K04F21Q, 18P09K04F16V, 18P09K04F21W, 18P09K04F16W, 18P09K04F21X, 18P09K04F21I, 18P09K04F21C, 18P09K04F21J, 18P09K04F22V, 18P09K04J02B, 18P09K04F21K, 18P09K04F21G, 18P09K04F22L, 18P09K04F22B, 18P09K04F17R, 18P09K04E25E, 18P09K04F21A, 18P09K04J01C, 18P09K04F21M, 18P09K04F21N, 18P09K04F16S, 18P09K04F21U, 18P09K04F22F, 18P09K04F22G, 18P09K04E20U, 18P09K04F16X, 18P09K04F16T, 18P09K04F16Z, 18P09K04F22W, 18P09K04F17W, 18P09K04F16Q, 18P09K04J01B, 18P09K04F21R, 18P09K04J01D, 18P09K04F21H, 18P09K04F16Y, 18P09K04F21Z, 18P09K04F17Q, 18P09K04I05E, 18P09K04E25Z, 18P09K04E25P, 18P09K04F21B, 18P09K04F21Y, 18P09K04F21T, 18P09K04F22Q, 18P09K04F22R, 18P09K04E25U, 18P09K04F21V, 18P09K04F21L, 18P09K04F21D, 18P09K04F21E, 18P09K04F17V, 18P09K04E25J, 18P09K04E20Z, 18P09K04F21F, 18P09K04F16R, 18P09K04F21S, 18P09K04J01E, 18P09K04F21P, 18P09K04F16U, 18P09K04J02A, 18P09K04F22K, 18P09K04F22A"]
    }     
  ]



