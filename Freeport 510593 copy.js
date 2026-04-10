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
    //to: "jorgecalle@hotmail.com, jorgecaller@gmail.com, alexisaza@hotmail.com,  ceereweb@gmail.com, Soporte2ceere@gmail.com, soportee4@gmail.com, soporte.ceere06068@gmail.com",
    to: '  Soporte2ceere@gmail.com',
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
      NombreArea: "510593",
      Referencia: "18P09K21L03L",
      Celdas: ["18P09K21L03L, 18N05N14M12R, 18P09K21H23M, 18P09K21H23Z, 18P09K21H23P, 18P09K21L04A, 18P09K21H19V, 18P09K21H19K, 18P09K21H19G, 18P09K21L09C, 18P09K21H24M, 18P09K21H19X, 18P09K21H24I, 18P09K21H19D, 18P09K21L09U, 18P09K21L04U, 18P09K21H24U, 18P09K21H19J, 18P09K21H14J, 18P09K21L10K, 18P09K21L10F, 18P09K21H25K, 18P09K21H25F, 18P09K21H15F, 18P09K21L05S, 18P09K21H25C, 18P09K21H15L, 18P09K21H10W, 18P09K21H10S, 18P09K21L10Y, 18P09K21L05T, 18P09K21H25N, 18P09K21H15T, 18P09K21L10Z, 18P09K21L10E, 18P09K21H20Z, 18P09K22I06A, 18P09K22E21V, 18P09K22I01G, 18P09K22E21G, 18P09K22E16W, 18P09K22E11L, 18P09K22E01W, 18P09K22E21X, 18P09K22E06M, 18P09K22I11T, 18P09K22I01D, 18P09K22E21T, 18P09K22E16D, 18P09K22E06D, 18P09K22I11U, 18P09K22I11E, 18P09K22I01P, 18P09K22E16U, 18P09K22I12V, 18P09K22I12F, 18P09K22I07Q, 18P09K22E17A, 18P09K22E12K, 18P09K22E02V, 18P09K22I07W, 18P09K22I02L, 18P09K22E22R, 18P09K22E17G, 18P09K22I07N, 18P09K22I02M, 18P09K22E17T, 18P09K22E17H, 18P09K22E12H, 18P09K22I17P, 18P09K22I17J, 18P09K22E22P, 18P09K22E17J, 18P09K22E07E, 18P09K22E02Z, 18P09K22I18A, 18P09K22I13Q, 18P09K22I13A, 18P09K22I08V, 18P09K22I08F, 18P09K22E18F, 18P09K22E13F, 18P09K22E08Q, 18P09K22E03K, 18P09K22I18G, 18P09K22I13B, 18P09K22I03W, 18P09K22E23L, 18P09K22E18W, 18P09K22E03W, 18P09K22E03G, 18P09K22I08S, 18P09K22I08H, 18P09K22I08C, 18P09K22E23C, 18P09K22E18X, 18P09K22I13N, 18P09K22I03Y, 18P09K22E23Y, 18P09K22E23I, 18P09K22E13I, 18P09K22E08T, 18P09K22E08I, 18P09K22E03T, 18P09K22E03D, 18P09K22I13Z, 18P09K22E23J, 18P09K22I09F, 18P09K22E24V, 18P09K22E19A, 18P09K22E14A, 18P09K22E09V, 18P09K22E09F, 18P09K22I19L, 18P09K22I14L, 18P09K22I09B, 18P09K22E24R, 18P09K22E19W, 18P09K22E09R, 18P09K22E09G, 18P09K22A24B, 18P09K22I14M, 18P09K22I09X, 18P09K22I04S, 18P09K22E19C, 18P09K22E09X, 18P09K22E09M, 18P09K22E04C, 18P09K22I24T, 18P09K22I19Z, 18P09K22I14Y, 18P09K22I14I, 18P09K22I04Y, 18P09K22E24P, 18P09K22E24I, 18P09K22I25Q, 18P09K22I20V, 18P09K22I10Q, 18P09K22I05V, 18P09K22I05Q, 18P09K22E10V, 18P09K22E05K, 18P09K22I25G, 18P09K22E20W, 18P09K22E10W, 18P09K22E05B, 18P09K22I25S, 18P09K22I25H, 18P09K22I25C, 18P09K22I20X, 18P09K22I15M, 18P09K22I05S, 18P09K22E25H, 18P09K22E20M, 18P09K22E20C, 18P09K22E15M, 18P09K22E20N, 18P09K22M05E, 18P09K22I25J, 18P09K22I05Z, 18P09K22I05U, 18P09K22E25E, 18P09K22E15U, 18P09K22E10J, 18P09K22N01F, 18P09K22J06V, 18P09K22F21Q, 18P09K22N01G, 18P09K22J16R, 18P09K22J16B, 18P09K22F21W, 18P09K22F06R, 18P09K22N01C, 18P09K22J21H, 18P09K22J11X, 18P09K22J11H, 18P09K22J01M, 18P09K22F16H, 18P09K22F11C, 18P09K22N01T, 18P09K22J21I, 18P09K22J16T, 18P09K22J06N, 18P09K22J01Y, 18P09K22J01T, 18P09K22F21N, 18P09K22F21I, 18P09K22F21D, 18P09K22F11I, 18P09K22F06N, 18P09K22N07A, 18P09K22N02F, 18P09K22J21U, 18P09K22J22K, 18P09K22J22A, 18P09K22J12Q, 18P09K22J06J, 18P09K22J07K, 18P09K22F21P, 18P09K22F17V, 18P09K22F16P, 18P09K22J02L, 18P09K22J02G, 18P09K22F22L, 18P09K22F22G, 18P09K22F22B, 18P09K22N02S, 18P09K22N02C, 18P09K22J22M, 18P09K22J02M, 18P09K22N07D, 18P09K22J17N, 18P09K22J12D, 18P09K22F17Y, 18P09K22F07Y, 18P09K22J12Z, 18P09K22J12E, 18P09K22J07P, 18P09K22N03F, 18P09K22J08Q, 18P09K22F18V, 18P09K22F13V, 18P09K22F13K, 18P09K22N03L, 18P09K22J03B, 18P09K22F23R, 18P09K22F23B, 18P09K22J23X, 18P09K22J03C, 18P09K22F18M, 18P09K22J23Y, 18P09K22F23N, 18P09K22F13Y, 18P09K22F23J, 18P09K22N04W, 18P09K22N04B, 18P09K22F19V, 18P09K22J14H, 18P09K22N04N, 18P09K22J14Y, 18P09K22J14N, 18P09K22N09E, 18P09K21L03A, 18P09K21H23V, 18P09K21L09A, 18P09K21L04Q, 18P09K21H24K, 18P09K21H19Q, 18P09K21L09G, 18P09K21L04W, 18P09K21H24W, 18P09K21H24G, 18P09K21L04H, 18P09K21H19S, 18P09K21L09N, 18P09K21L04T, 18P09K21H24D, 18P09K21L09P, 18P09K21H19Z, 18P09K21H14U, 18P09K21L05Q, 18P09K21H15R, 18P09K21H15G, 18P09K21L10N, 18P09K21H20T, 18P09K21H10Y, 18P09K21H25J, 18P09K21H25E, 18P09K21H15P, 18P09K21H10Z, 18P09K22I06K, 18P09K22E11Q, 18P09K22I11L, 18P09K22I06B, 18P09K22I01B, 18P09K22I06H, 18P09K22E21C, 18P09K22I06D, 18P09K22I01Y, 18P09K22I01I, 18P09K22E16I, 18P09K22I06J, 18P09K22E21P, 18P09K22E11Z, 18P09K22E11E, 18P09K22I07A, 18P09K22E17V, 18P09K22E17K, 18P09K22E02Q, 18P09K22I02G, 18P09K22E17L, 18P09K22E12R, 18P09K22E07W, 18P09K22I17I, 18P09K22I12X, 18P09K22I02X, 18P09K22I02T, 18P09K22E22H, 18P09K22E22D, 18P09K22E17S, 18P09K22E17M, 18P09K22E17N, 18P09K22E17I, 18P09K22E12N, 18P09K22E12D, 18P09K22E02S, 18P09K22E02N, 18P09K22E02I, 18P09K22I12P, 18P09K22I12J, 18P09K22E12U, 18P09K22E07Z, 18P09K22E02P, 18P09K22E02J, 18P09K22E02E, 18P09K22I08K, 18P09K22I08R, 18P09K22E23W, 18P09K22E13G, 18P09K22E08G, 18P09K22A23X, 18P09K22A23M, 18P09K22I08Y, 18P09K22E18Y, 18P09K22I18J, 18P09K22I18E, 18P09K22I13U, 18P09K22I13J, 18P09K22I03P, 18P09K22E13U, 18P09K22E13J, 18P09K22E08P, 18P09K22I14V, 18P09K22I14K, 18P09K22I04A, 18P09K22E24Q, 18P09K22E24F, 18P09K22E14K, 18P09K22E14F, 18P09K22A24V, 18P09K22A24Q, 18P09K22I24G, 18P09K22I19R, 18P09K22I04R, 18P09K22E19G, 18P09K22I04X, 18P09K22E09H, 18P09K22A24X, 18P09K22A24M, 18P09K22I19T, 18P09K22I19N, 18P09K22I09Z, 18P09K22E19P, 18P09K22E14J, 18P09K22E09P, 18P09K22A24Y, 18P09K22I25F, 18P09K22I15Q, 18P09K22E20V, 18P09K22E15A, 18P09K22E10F, 18P09K22E05Q, 18P09K22I25W, 18P09K22I20G, 18P09K22I05L, 18P09K22E15L, 18P09K22E15G, 18P09K22E10L, 18P09K22E05L, 18P09K22E25X, 18P09K22E20X, 18P09K22E10H, 18P09K22E05H, 18P09K22I25Y, 18P09K22I25D, 18P09K22I20I, 18P09K22I15T, 18P09K22I10I, 18P09K22I05T, 18P09K22I05I, 18P09K22E15I, 18P09K22E15D, 18P09K22E05N, 18P09K22I25P, 18P09K22I15J, 18P09K22I10U, 18P09K22E10E, 18P09K22J21V, 18P09K22J16K, 18P09K22J16A, 18P09K22J11Q, 18P09K22J11K, 18P09K22F16K, 18P09K22F16F, 18P09K22F06V, 18P09K22F06F, 18P09K22F01V, 18P09K22J21B, 18P09K22F16L, 18P09K22F11R, 18P09K22F01R, 18P09K22N01M, 18P09K22N01H, 18P09K22J11S, 18P09K22J06M, 18P09K22F21H, 18P09K22F16M, 18P09K22F06H, 18P09K22J21N, 18P09K22J16Y, 18P09K22J16D, 18P09K22J11I, 18P09K22F11T, 18P09K22F06I, 18P09K22J22Q, 18P09K22J17A, 18P09K22J11Z, 18P09K22J06U, 18P09K22F22V, 18P09K22F21U, 18P09K22F16Z, 18P09K22F16J, 18P09K22F07Q, 18P09K22N02R, 18P09K22J22W, 18P09K22J22B, 18P09K22J12B, 18P09K22F12B, 18P09K22N02H, 18P09K22J12C, 18P09K22J02X, 18P09K22J02C, 18P09K22F07S, 18P09K22J17I, 18P09K22J12N, 18P09K22J02I, 18P09K22J02D, 18P09K22F12D, 18P09K22N02U, 18P09K22J17J, 18P09K22J17E, 18P09K22J12U, 18P09K22J07U, 18P09K22J02P, 18P09K22F22Z, 18P09K22F17U, 18P09K22F12U, 18P09K22N03A, 18P09K22J13V, 18P09K22J13A, 18P09K22J03A, 18P09K22F23A, 18P09K22F18Q, 18P09K22J13W, 18P09K22J13H, 18P09K22F23X, 18P09K22F23S, 18P09K22F18C, 18P09K22N03D, 18P09K22J23T, 18P09K22J18D, 18P09K22J13Y, 18P09K22J03D, 18P09K22N03U, 18P09K22N03P, 18P09K22N03E, 18P09K22J18J, 18P09K22J18E, 18P09K22F23E, 18P09K22N04G, 18P09K22N04A, 18P09K22J19A, 18P09K22J14V, 18P09K22J14G, 18P09K22F24V, 18P09K22F24B, 18P09K22F19F, 18P09K21L03B, 18P09K21L03X, 18P09K21L03C, 18P09K21H23J, 18P09K21L04R, 18P09K21L04B, 18P09K21L04M, 18P09K21H24S, 18P09K21H24C, 18P09K21H19H, 18P09K21H14X, 18P09K21L04N, 18P09K21L04I, 18P09K21H14Y, 18P09K21L09J, 18P09K21L04E, 18P09K21H24Z, 18P09K21H19P, 18P09K21L05A, 18P09K21H20F, 18P09K21H15V, 18P09K21L10L, 18P09K21L10H, 18P09K21L05G, 18P09K21H20S, 18P09K21H20G, 18P09K21H15X, 18P09K21H15S, 18P09K21H15H, 18P09K21H15B, 18P09K21H15C, 18P09K21L05I, 18P09K21H20N, 18P09K21L15E, 18P09K21L05Z, 18P09K21H25Z, 18P09K21H25U, 18P09K21H25P, 18P09K21H15Z, 18P09K21H15U, 18P09K22I06Q, 18P09K22I06F, 18P09K22I01Q, 18P09K22E16V, 18P09K22E06V, 18P09K22I11G, 18P09K22I06R, 18P09K22I01R, 18P09K22E21R, 18P09K22E21L, 18P09K22E16L, 18P09K22E11W, 18P09K22E06L, 18P09K22I11S, 18P09K22I06C, 18P09K22E16H, 18P09K22E11X, 18P09K22E11S, 18P09K22I11Y, 18P09K22I11I, 18P09K22I11D, 18P09K22I06I, 18P09K22I01N, 18P09K22E21N, 18P09K22E16Y, 18P09K22E11N, 18P09K22E11I, 18P09K22I11P, 18P09K22I06E, 18P09K22E16Z, 18P09K22E11U, 18P09K22I12K, 18P09K22I07V, 18P09K22E22A, 18P09K22I12L, 18P09K22I07R, 18P09K22I07G, 18P09K22I02B, 18P09K22E12W, 18P09K22E07B, 18P09K22E02L, 18P09K22I17D, 18P09K22I12Y, 18P09K22I12T, 18P09K22I12D, 18P09K22I07Y, 18P09K22I02Y, 18P09K22I02N, 18P09K22I02C, 18P09K22E22C, 18P09K22E17Y, 18P09K22E17D, 18P09K22E12M, 18P09K22I12Z, 18P09K22E07U, 18P09K22I18F, 18P09K22I13F, 18P09K22I03A, 18P09K22E03Q, 18P09K22I18R, 18P09K22I03B, 18P09K22E13W, 18P09K22I18C, 18P09K22I13C, 18P09K22I03X, 18P09K22E23M, 18P09K22E03H, 18P09K22I18N, 18P09K22I18D, 18P09K22I13Y, 18P09K22I13I, 18P09K22E23T, 18P09K22E23N, 18P09K22E23D, 18P09K22E13D, 18P09K22E08D, 18P09K22E03I, 18P09K22A23Y, 18P09K22I18U, 18P09K22I18P, 18P09K22I13P, 18P09K22E23P, 18P09K22E03P, 18P09K22E03E, 18P09K22I19F, 18P09K22I19A, 18P09K22I09Q, 18P09K22A24F, 18P09K22I24L, 18P09K22E24W, 18P09K22E19R, 18P09K22E19L, 18P09K22E09L, 18P09K22I14X, 18P09K22I09M, 18P09K22E24S, 18P09K22E19S, 18P09K22I24J, 18P09K22I09U, 18P09K22I09J, 18P09K22I04U, 18P09K22I04E, 18P09K22E24N, 18P09K22E19N, 18P09K22E14I, 18P09K22E14D, 18P09K22E09U, 18P09K22E09N, 18P09K22E09I, 18P09K22E09D, 18P09K22E04P, 18P09K22E04D, 18P09K22A24P, 18P09K22I10F, 18P09K22E15V, 18P09K22I20W, 18P09K22I20R, 18P09K22I20L, 18P09K22I15L, 18P09K22I10B, 18P09K22I05W, 18P09K22E25L, 18P09K22E20R, 18P09K22E20G, 18P09K22E10G, 18P09K22I25M, 18P09K22I20S, 18P09K22I20M, 18P09K22E15S, 18P09K22E15H, 18P09K22E10C, 18P09K22I20N, 18P09K22I15D, 18P09K22I05N, 18P09K22E20T, 18P09K22E10I, 18P09K22M05J, 18P09K22I25Z, 18P09K22I10J, 18P09K22E10Z, 18P09K22J21A, 18P09K22J16F, 18P09K22J01V, 18P09K22F21K, 18P09K22F16V, 18P09K22F11V, 18P09K22F06K, 18P09K22J11W, 18P09K22J11L, 18P09K22J06L, 18P09K22J01L, 18P09K22J01G, 18P09K22F06W, 18P09K22F06L, 18P09K22N01S, 18P09K22J21X, 18P09K22J16M, 18P09K22J11M, 18P09K22J06C, 18P09K22J01C, 18P09K22F16C, 18P09K22J16I, 18P09K22J06Y, 18P09K22F16D, 18P09K22F06Y, 18P09K22F06D, 18P09K22N01P, 18P09K22N02A, 18P09K22J17V, 18P09K22J17K, 18P09K22J12V, 18P09K22J11U, 18P09K22J12K, 18P09K22J06Z, 18P09K22J07A, 18P09K22J02V, 18P09K22J02F, 18P09K22F21E, 18P09K22F12Q, 18P09K22N02W, 18P09K22J22L, 18P09K22J17B, 18P09K22F17R, 18P09K22F07R, 18P09K22J22H, 18P09K22J07M, 18P09K22J07H, 18P09K22F22M, 18P09K22F17H, 18P09K22F17C, 18P09K22N02T, 18P09K22J02T, 18P09K22F22Y, 18P09K22F17T, 18P09K22F12Y, 18P09K22N02J, 18P09K22F17P, 18P09K22F12Z, 18P09K22F12E, 18P09K22N03K, 18P09K22J23K, 18P09K22J13K, 18P09K22J08V, 18P09K22J03K, 18P09K22J03F, 18P09K22F18F, 18P09K22N03R, 18P09K22N03B, 18P09K22J23R, 18P09K22J18G, 18P09K22F18L, 18P09K22F18G, 18P09K22F18B, 18P09K22J13X, 18P09K22J13C, 18P09K22F18S, 18P09K22J13T, 18P09K22F18Y, 18P09K22J13P, 18P09K22J13J, 18P09K22F23P, 18P09K22F18P, 18P09K22J19F, 18P09K22J19B, 18P09K22J14K, 18P09K22N04S, 18P09K22J19D, 18P09K22J14U, 18P09K22J14P, 18P09K21L03S, 18P09K21L03H, 18P09K21H23X, 18P09K21L03T, 18P09K21L03N, 18P09K21H23U, 18P09K21L04V, 18P09K21H24F, 18P09K21H24L, 18P09K21H19L, 18P09K21L09I, 18P09K21L09D, 18P09K21L04D, 18P09K21H19T, 18P09K21L04Z, 18P09K21L04J, 18P09K21H24J, 18P09K21H24E, 18P09K21H25A, 18P09K21H20Q, 18P09K21H20K, 18P09K21L10W, 18P09K21L10X, 18P09K21L10R, 18P09K21L10S, 18P09K21L10G, 18P09K21L05X, 18P09K21L05L, 18P09K21H25L, 18P09K21H25B, 18P09K21H15W, 18P09K21L15I, 18P09K21L15D, 18P09K21L05Y, 18P09K21H25I, 18P09K21H20I, 18P09K21L05J, 18P09K21H20P, 18P09K21H15E, 18P09K22I11K, 18P09K22I11A, 18P09K22E11K, 18P09K22E06A, 18P09K22I06W, 18P09K22E16G, 18P09K22E16B, 18P09K22E11R, 18P09K22E06H, 18P09K22E01X, 18P09K22I06Y, 18P09K22E16T, 18P09K22E06I, 18P09K22I11J, 18P09K22E21Z, 18P09K22E21U, 18P09K22E21J, 18P09K22E16E, 18P09K22E06E, 18P09K22E01U, 18P09K22I12A, 18P09K22I02A, 18P09K22E22K, 18P09K22E17F, 18P09K22E12Q, 18P09K22E07Q, 18P09K22E07F, 18P09K22I12W, 18P09K22I07B, 18P09K22E12G, 18P09K22I12M, 18P09K22I07C, 18P09K22E22Y, 18P09K22E22I, 18P09K22E12S, 18P09K22E12T, 18P09K22E07D, 18P09K22E02X, 18P09K22E02T, 18P09K22I07Z, 18P09K22I07E, 18P09K22I02U, 18P09K22I02J, 18P09K22E22Z, 18P09K22E22U, 18P09K22E12E, 18P09K22I13K, 18P09K22E23V, 18P09K22E18V, 18P09K22E03A, 18P09K22I18L, 18P09K22I13W, 18P09K22I08W, 18P09K22I08B, 18P09K22I03R, 18P09K22I03G, 18P09K22E03R, 18P09K22E23H, 18P09K22E18S, 18P09K22E03S, 18P09K22I13T, 18P09K22I08D, 18P09K22E18I, 18P09K22E03Y, 18P09K22E18J, 18P09K22A23Z, 18P09K22I24A, 18P09K22I19Q, 18P09K22I14A, 18P09K22I04F, 18P09K22E24A, 18P09K22E19F, 18P09K22E09Q, 18P09K22E04V, 18P09K22E04F, 18P09K22I14W, 18P09K22I14B, 18P09K22I09L, 18P09K22E24L, 18P09K22E24G, 18P09K22E19B, 18P09K22E14L, 18P09K22E14B, 18P09K22E04W, 18P09K22E04B, 18P09K22A24W, 18P09K22A24L, 18P09K22I14C, 18P09K22I09S, 18P09K22I09C, 18P09K22I04C, 18P09K22E24M, 18P09K22E19M, 18P09K22E14S, 18P09K22E14H, 18P09K22E04S, 18P09K22E04M, 18P09K22I24U, 18P09K22I24E, 18P09K22I19P, 18P09K22I19D, 18P09K22I14P, 18P09K22I09N, 18P09K22I09P, 18P09K22I04P, 18P09K22I04D, 18P09K22E24T, 18P09K22E24D, 18P09K22E19U, 18P09K22E14Y, 18P09K22E09Y, 18P09K22E04Y, 18P09K22E04E, 18P09K22I25A, 18P09K22I10V, 18P09K22E25V, 18P09K22E15Q, 18P09K22A25V, 18P09K22I25R, 18P09K22I25L, 18P09K22I15W, 18P09K22I10G, 18P09K22I05R, 18P09K22I05G, 18P09K22E20B, 18P09K22E15R, 18P09K22I25X, 18P09K22I15C, 18P09K22I10X, 18P09K22I10H, 18P09K22I05M, 18P09K22I05C, 18P09K22E10X, 18P09K22E05C, 18P09K22I25N, 18P09K22I20D, 18P09K22I15Y, 18P09K22I15I, 18P09K22E15N, 18P09K22I15Z, 18P09K22E25J, 18P09K22E20P, 18P09K22E15J, 18P09K22E05U, 18P09K22E05P, 18P09K22F16A, 18P09K22F11Q, 18P09K22F01Q, 18P09K22N01B, 18P09K22J01B, 18P09K22F21B, 18P09K22F11B, 18P09K22F06G, 18P09K22J21M, 18P09K22J21C, 18P09K22J11C, 18P09K22J01X, 18P09K22J01H, 18P09K22F21M, 18P09K22F06M, 18P09K22J21Y, 18P09K22F21Y, 18P09K22F21T, 18P09K22F16Y, 18P09K22F16N, 18P09K22F16I, 18P09K22J21Z, 18P09K22J22V, 18P09K22J21P, 18P09K22J22F, 18P09K22J11P, 18P09K22J11J, 18P09K22J01Z, 18P09K22J01P, 18P09K22J01E, 18P09K22F17K, 18P09K22F11U, 18P09K22F07V, 18P09K22F06U, 18P09K22F07K, 18P09K22N02L, 18P09K22J22G, 18P09K22J17W, 18P09K22J12W, 18P09K22J02R, 18P09K22J22X, 18P09K22J17C, 18P09K22J12H, 18P09K22J02S, 18P09K22F17X, 18P09K22F17S, 18P09K22N02Y, 18P09K22J22Y, 18P09K22J12I, 18P09K22J07T, 18P09K22J07I, 18P09K22F12T, 18P09K22N02P, 18P09K22F22U, 18P09K22F22J, 18P09K22J13F, 18P09K22N03W, 18P09K22N03G, 18P09K22J13L, 18P09K22J08W, 18P09K22J03G, 18P09K22F23L, 18P09K22N03S, 18P09K22J18H, 18P09K22F13X, 18P09K22N04K, 18P09K22N04F, 18P09K22J24V, 18P09K22J14A, 18P09K22F24A, 18P09K22F19Q, 18P09K22F19L, 18P09K22N04X, 18P09K22J14T, 18P09K21H23S, 18P09K21L03Y, 18P09K21L03U, 18P09K21L09B, 18P09K21H24R, 18P09K21L04S, 18P09K21L04C, 18P09K21H24H, 18P09K21L04Y, 18P09K21L04P, 18P09K21L05K, 18P09K21L05F, 18P09K21H25V, 18P09K21H25Q, 18P09K21L10B, 18P09K21L05M, 18P09K21L05H, 18P09K21L05B, 18P09K21H25M, 18P09K21H25G, 18P09K21H20L, 18P09K21H10X, 18P09K21L10T, 18P09K21L10D, 18P09K21L05D, 18P09K21H25Y, 18P09K21H15I, 18P09K21H20U, 18P09K21H20E, 18P09K21H10P, 18P09K22I06V, 18P09K22I01F, 18P09K22I01A, 18P09K22E21K, 18P09K22E21F, 18P09K22E16Q, 18P09K22E11A, 18P09K22E01V, 18P09K22I11B, 18P09K22E06W, 18P09K22E16S, 18P09K22E16M, 18P09K22E11C, 18P09K22E06X, 18P09K22E01S, 18P09K22I06N, 18P09K22E21I, 18P09K22E21D, 18P09K22E16N, 18P09K22E11Y, 18P09K22E06N, 18P09K22I06P, 18P09K22I01U, 18P09K22I01E, 18P09K22E06U, 18P09K22E01Z, 18P09K22I17A, 18P09K22I07K, 18P09K22I02V, 18P09K22I02F, 18P09K22E22V, 18P09K22E22Q, 18P09K22E17Q, 18P09K22E12V, 18P09K22E07A, 18P09K22E22G, 18P09K22E07R, 18P09K22E07L, 18P09K22E07G, 18P09K22I17H, 18P09K22I12N, 18P09K22I07S, 18P09K22I07D, 18P09K22I02H, 18P09K22I02D, 18P09K22E22S, 18P09K22E22T, 18P09K22E22N, 18P09K22E12Y, 18P09K22E07N, 18P09K22E07H, 18P09K22E07C, 18P09K22E02M, 18P09K22I02Z, 18P09K22I02P, 18P09K22E17P, 18P09K22E12Z, 18P09K22E12J, 18P09K22E02U, 18P09K22I18Q, 18P09K22I18K, 18P09K22I13V, 18P09K22I03V, 18P09K22I03Q, 18P09K22E23F, 18P09K22E13K, 18P09K22A23V, 18P09K22I18W, 18P09K22I08G, 18P09K22I03L, 18P09K22E23R, 18P09K22E23B, 18P09K22E08W, 18P09K22E08R, 18P09K22E08L, 18P09K22A23W, 18P09K22I13X, 18P09K22I13S, 18P09K22I03C, 18P09K22E23X, 18P09K22E18C, 18P09K22E13S, 18P09K22E03M, 18P09K22A23S, 18P09K22I18Y, 18P09K22I08T, 18P09K22I08N, 18P09K22E18D, 18P09K22E13N, 18P09K22A23T, 18P09K22I03Z, 18P09K22E18P, 18P09K22E13Z, 18P09K22E08E, 18P09K22E03U, 18P09K22A23U, 18P09K22I19V, 18P09K22I19K, 18P09K22I09V, 18P09K22E19Q, 18P09K22E09A, 18P09K22I19G, 18P09K22I19B, 18P09K22I09W, 18P09K22I04L, 18P09K22E04L, 18P09K22I24C, 18P09K22I19S, 18P09K22I14H, 18P09K22I04M, 18P09K22E24C, 18P09K22E19H, 18P09K22E09S, 18P09K22A24S, 18P09K22I24I, 18P09K22I14J, 18P09K22I14D, 18P09K22I09T, 18P09K22I09I, 18P09K22I04T, 18P09K22I04I, 18P09K22E19Y, 18P09K22E19Z, 18P09K22E19I, 18P09K22E14N, 18P09K22E04T, 18P09K22E04I, 18P09K22I20Q, 18P09K22I10A, 18P09K22I05F, 18P09K22I05A, 18P09K22E25K, 18P09K22E20K, 18P09K22E10K, 18P09K22E10A, 18P09K22E05F, 18P09K22A25Q, 18P09K22M05B, 18P09K22I10L, 18P09K22I05B, 18P09K22E10B, 18P09K22E05W, 18P09K22I20H, 18P09K22I10S, 18P09K22I10M, 18P09K22I25I, 18P09K22I20T, 18P09K22I10T, 18P09K22I10D, 18P09K22E25Y, 18P09K22E25N, 18P09K22E25D, 18P09K22E20I, 18P09K22E15T, 18P09K22E10D, 18P09K22E05T, 18P09K22I15E, 18P09K22I05P, 18P09K22I05J, 18P09K22E25U, 18P09K22E20U, 18P09K22E10P, 18P09K22N01K, 18P09K22J21Q, 18P09K22J21K, 18P09K22J21F, 18P09K22J01K, 18P09K22J01F, 18P09K22F21A, 18P09K22F11A, 18P09K22N01L, 18P09K22J21W, 18P09K22J21L, 18P09K22J21G, 18P09K22J11G, 18P09K22F11L, 18P09K22F11G, 18P09K22F06B, 18P09K22J16H, 18P09K22F06C, 18P09K22N01N, 18P09K22N01I, 18P09K22J21T, 18P09K22J21D, 18P09K22J16N, 18P09K22J06T, 18P09K22J06D, 18P09K22J01N, 18P09K22F16T, 18P09K22F11N, 18P09K22F11D, 18P09K22N01U, 18P09K22J16U, 18P09K22J16P, 18P09K22J17Q, 18P09K22J11E, 18P09K22J06E, 18P09K22F22F, 18P09K22F16U, 18P09K22F12K, 18P09K22F11J, 18P09K22F12F, 18P09K22F06Z, 18P09K22N02G, 18P09K22J17R, 18P09K22J07B, 18P09K22F17L, 18P09K22N07C, 18P09K22N02M, 18P09K22J17S, 18P09K22J17M, 18P09K22J07S, 18P09K22F17M, 18P09K22F12S, 18P09K22F12H, 18P09K22N02D, 18P09K22J22T, 18P09K22J12T, 18P09K22F17N, 18P09K22F17D, 18P09K22J22J, 18P09K22J12J, 18P09K22F22P, 18P09K22F12J, 18P09K22J23Q, 18P09K22J18K, 18P09K22J18A, 18P09K22F23Q, 18P09K22F18A, 18P09K22F13Q, 18P09K22J23L, 18P09K22J13R, 18P09K22F13W, 18P09K22F13L, 18P09K22N03H, 18P09K22J03H, 18P09K22F13S, 18P09K22N03N, 18P09K22J18I, 18P09K22J13D, 18P09K22F18N, 18P09K22F18D, 18P09K22N03J, 18P09K22F13Z, 18P09K22J19G, 18P09K22J14Q, 18P09K22J14F, 18P09K22F24F, 18P09K22J14X, 18P09K22N09D, 18P09K22N04Y, 18P09K21H23N, 18P09K21H23I, 18P09K21L03J, 18P09K21H24V, 18P09K21H24Q, 18P09K21L04X, 18P09K21H19M, 18P09K21H19C, 18P09K21H19Y, 18P09K21H19I, 18P09K21H14T, 18P09K21H24P, 18P09K21H19E, 18P09K21L05V, 18P09K21H15K, 18P09K21H25X, 18P09K21H20R, 18P09K21H20B, 18P09K21L10I, 18P09K21H20Y, 18P09K21H15Y, 18P09K21H15D, 18P09K21H10T, 18P09K21L10U, 18P09K21L10P, 18P09K21L05P, 18P09K21L05E, 18P09K21H15J, 18P09K22I11F, 18P09K22I01K, 18P09K22E21Q, 18P09K22E11V, 18P09K22E11F, 18P09K22E06Q, 18P09K22E06F, 18P09K22I06L, 18P09K22E21W, 18P09K22E11G, 18P09K22E11B, 18P09K22E06B, 18P09K22I01S, 18P09K22I01M, 18P09K22I01C, 18P09K22E11M, 18P09K22E06S, 18P09K22E06C, 18P09K22E11T, 18P09K22E06T, 18P09K22E01T, 18P09K22E16P, 18P09K22E11P, 18P09K22E01P, 18P09K22I12Q, 18P09K22I07F, 18P09K22E22F, 18P09K22E12F, 18P09K22E07K, 18P09K22E02K, 18P09K22I17G, 18P09K22I12R, 18P09K22I12B, 18P09K22E22L, 18P09K22E22B, 18P09K22I02S, 18P09K22E07Y, 18P09K22E07M, 18P09K22E07I, 18P09K22I17E, 18P09K22E17Z, 18P09K22E17U, 18P09K22E12P, 18P09K22E07P, 18P09K22E07J, 18P09K22I03K, 18P09K22I03F, 18P09K22E18Q, 18P09K22E13V, 18P09K22E13Q, 18P09K22E08F, 18P09K22I13L, 18P09K22I13G, 18P09K22I08L, 18P09K22E18R, 18P09K22E13R, 18P09K22E13B, 18P09K22E08B, 18P09K22I18M, 18P09K22I13H, 18P09K22I08M, 18P09K22I03H, 18P09K22E18M, 18P09K22E08S, 18P09K22E08M, 18P09K22E03C, 18P09K22I23D, 18P09K22I18I, 18P09K22I08I, 18P09K22I03N, 18P09K22E13T, 18P09K22E03N, 18P09K22A23N, 18P09K22I18Z, 18P09K22I08U, 18P09K22I08P, 18P09K22I03U, 18P09K22E23U, 18P09K22E18Z, 18P09K22E13P, 18P09K22E08J, 18P09K22A23P, 18P09K22I14F, 18P09K22I04V, 18P09K22I04Q, 18P09K22E24K, 18P09K22E19K, 18P09K22E09K, 18P09K22E04K, 18P09K22E04A, 18P09K22I19W, 18P09K22I09G, 18P09K22I04B, 18P09K22E04G, 18P09K22I19M, 18P09K22I24P, 18P09K22I24D, 18P09K22I19U, 18P09K22I19J, 18P09K22I14Z, 18P09K22I14E, 18P09K22I04N, 18P09K22I04J, 18P09K22E24Y, 18P09K22E24E, 18P09K22E14T, 18P09K22E14U, 18P09K22E14P, 18P09K22E09T, 18P09K22E04U, 18P09K22E04J, 18P09K22A24T, 18P09K22A24Z, 18P09K22I20K, 18P09K22I15V, 18P09K22E20A, 18P09K22I25B, 18P09K22I20B, 18P09K22E20L, 18P09K22E05G, 18P09K22I20C, 18P09K22I15X, 18P09K22I05H, 18P09K22E15X, 18P09K22E15C, 18P09K22E10S, 18P09K22E05X, 18P09K22E05S, 18P09K22E05M, 18P09K22M05I, 18P09K22I20Y, 18P09K22I10Y, 18P09K22I05Y, 18P09K22E25T, 18P09K22I25U, 18P09K22I10Z, 18P09K22I10P, 18P09K22E25P, 18P09K22E20J, 18P09K22E10U, 18P09K22J16V, 18P09K22J11V, 18P09K22F21V, 18P09K22F21F, 18P09K22F11K, 18P09K22N01R, 18P09K22J06R, 18P09K22J06B, 18P09K22J01W, 18P09K22F21G, 18P09K22F16R, 18P09K22F16G, 18P09K22F01W, 18P09K22F21X, 18P09K22F21S, 18P09K22F21C, 18P09K22F16S, 18P09K22F11S, 18P09K22F01X, 18P09K22J11N, 18P09K22N01Z, 18P09K22N02K, 18P09K22N01E, 18P09K22J17F, 18P09K22J06P, 18P09K22J01J, 18P09K22F22K, 18P09K22F22A, 18P09K22F17Q, 18P09K22F17F, 18P09K22F17A, 18P09K22F06P, 18P09K22J17G, 18P09K22J07W, 18P09K22J07G, 18P09K22J02B, 18P09K22F17W, 18P09K22F17G, 18P09K22F12L, 18P09K22N02X, 18P09K22J07C, 18P09K22F22S, 18P09K22F22H, 18P09K22F12M, 18P09K22F12C, 18P09K22J02N, 18P09K22N02Z, 18P09K22J02U, 18P09K22F22E, 18P09K22J23V, 18P09K22J18F, 18P09K22J13Q, 18P09K22F23V, 18P09K22J23W, 18P09K22J18B, 18P09K22F18R, 18P09K22F13R, 18P09K22J13M, 18P09K22J08X, 18P09K22J13N, 18P09K22J13I, 18P09K22F23T, 18P09K22F23I, 18P09K22F23D, 18P09K22F18T, 18P09K22J13U, 18P09K22F23U, 18P09K22J14R, 18P09K22F19W, 18P09K22F19G, 18P09K22J19C, 18P09K22N04I, 18P09K22J15F, 18P09K21L03F, 18P09K21L03G, 18P09K21L03M, 18P09K21L03I, 18P09K21H23T, 18P09K21L09F, 18P09K21L04K, 18P09K21H19F, 18P09K21L04L, 18P09K21L04G, 18P09K21H19W, 18P09K21H19B, 18P09K21L09M, 18P09K21H24Y, 18P09K21H19U, 18P09K21H14Z, 18P09K21H15A, 18P09K21L15C, 18P09K21L05C, 18P09K21H25W, 18P09K21H25S, 18P09K21H20W, 18P09K21H20M, 18P09K21H20C, 18P09K21L05N, 18P09K21H10N, 18P09K21L10J, 18P09K21L05U, 18P09K21H10U, 18P09K22E21A, 18P09K22E16F, 18P09K22E16A, 18P09K22E06K, 18P09K22I01L, 18P09K22I11H, 18P09K22I06X, 18P09K22I01H, 18P09K22E21S, 18P09K22E21M, 18P09K22E21H, 18P09K22E11H, 18P09K22I06T, 18P09K22I01T, 18P09K22E11D, 18P09K22E06Y, 18P09K22I01J, 18P09K22E21E, 18P09K22E06P, 18P09K22E07V, 18P09K22I07L, 18P09K22I02W, 18P09K22I02R, 18P09K22E17W, 18P09K22E17B, 18P09K22I12S, 18P09K22I12H, 18P09K22I12I, 18P09K22I07X, 18P09K22I07M, 18P09K22I07H, 18P09K22E22M, 18P09K22E17X, 18P09K22E17C, 18P09K22E12X, 18P09K22E12I, 18P09K22E07X, 18P09K22E02Y, 18P09K22I02E, 18P09K22E17E, 18P09K22I08A, 18P09K22E23Q, 18P09K22E23A, 18P09K22E18A, 18P09K22E08K, 18P09K22E08A, 18P09K22E03F, 18P09K22E23G, 18P09K22E18G, 18P09K22E18B, 18P09K22E13L, 18P09K22A23R, 18P09K22I18H, 18P09K22I08X, 18P09K22I03S, 18P09K22E23S, 18P09K22E13X, 18P09K22E13M, 18P09K22E08X, 18P09K22E08C, 18P09K22E03X, 18P09K22I18T, 18P09K22I03T, 18P09K22I03D, 18P09K22E08N, 18P09K22I23E, 18P09K22I08J, 18P09K22I03E, 18P09K22E23Z, 18P09K22E23E, 18P09K22E18U, 18P09K22E13E, 18P09K22E08U, 18P09K22A23J, 18P09K22I24F, 18P09K22I14Q, 18P09K22I09A, 18P09K22I04K, 18P09K22E19V, 18P09K22E14V, 18P09K22E14Q, 18P09K22E04Q, 18P09K22I04G, 18P09K22E24B, 18P09K22E14R, 18P09K22E09W, 18P09K22E04R, 18P09K22I19X, 18P09K22I19C, 18P09K22I09H, 18P09K22E19X, 18P09K22E14M, 18P09K22A24H, 18P09K22I24N, 18P09K22I19Y, 18P09K22I19I, 18P09K22I14T, 18P09K22I09D, 18P09K22I09E, 18P09K22E24Z, 18P09K22E24U, 18P09K22E24J, 18P09K22E14Z, 18P09K22E14E, 18P09K22E04Z, 18P09K22A24N, 18P09K22I25V, 18P09K22I25K, 18P09K22I10K, 18P09K22I05K, 18P09K22E25F, 18P09K22E25A, 18P09K22E15F, 18P09K22E05A, 18P09K22I15R, 18P09K22I15B, 18P09K22I10W, 18P09K22I10R, 18P09K22E25R, 18P09K22E15B, 18P09K22A25W, 18P09K22M05C, 18P09K22E25S, 18P09K22E25M, 18P09K22E25C, 18P09K22E20H, 18P09K22E10M, 18P09K22M05D, 18P09K22I25T, 18P09K22I15N, 18P09K22E20Y, 18P09K22E20D, 18P09K22E10Y, 18P09K22E05Y, 18P09K22I20U, 18P09K22I20J, 18P09K22I20E, 18P09K22I15U, 18P09K22I10E, 18P09K22E25Z, 18P09K22E20Z, 18P09K22E05Z, 18P09K22J06Q, 18P09K22J01A, 18P09K22F11F, 18P09K22F06A, 18P09K22J16L, 18P09K22J11R, 18P09K22J11B, 18P09K22J01R, 18P09K22F21R, 18P09K22F21L, 18P09K22F16W, 18P09K22F16B, 18P09K22F11W, 18P09K22J16S, 18P09K22J06S, 18P09K22J06H, 18P09K22F16X, 18P09K22J11Y, 18P09K22J11D, 18P09K22J01I, 18P09K22N02Q, 18P09K22N01J, 18P09K22J21E, 18P09K22J16J, 18P09K22J12A, 18P09K22J07V, 18P09K22J01U, 18P09K22J02K, 18P09K22J02A, 18P09K22F16E, 18P09K22F11Z, 18P09K22F12V, 18P09K22F11P, 18P09K22N07B, 18P09K22J17L, 18P09K22J12R, 18P09K22J12L, 18P09K22F22R, 18P09K22F17B, 18P09K22J07X, 18P09K22J02H, 18P09K22F22X, 18P09K22F07X, 18P09K22N02N, 18P09K22N02I, 18P09K22J22N, 18P09K22J22I, 18P09K22J17T, 18P09K22J07D, 18P09K22F22T, 18P09K22F22N, 18P09K22F22D, 18P09K22F17I, 18P09K22F12N, 18P09K22N02E, 18P09K22J22U, 18P09K22J22P, 18P09K22J17P, 18P09K22J12P, 18P09K22J07Z, 18P09K22F17Z, 18P09K22F17E, 18P09K22F12P, 18P09K22F23F, 18P09K22F18K, 18P09K22F13F, 18P09K22J13B, 18P09K22F23W, 18P09K22F23G, 18P09K22F18W, 18P09K22N03M, 18P09K22J18C, 18P09K22F23H, 18P09K22F23Z, 18P09K22F18Z, 18P09K22F18J, 18P09K22F18E, 18P09K22N04R, 18P09K22N04L, 18P09K22J14L, 18P09K22F24K, 18P09K22F19A, 18P09K22N04M, 18P09K22N04H, 18P09K22N04C, 18P09K22J14J, 18P09K21L02P, 18P09K21L02J, 18P09K21L03R, 18P09K21L03K, 18P09K21H23W, 18P09K21H23R, 18P09K21L03D, 18P09K21H23Y, 18P09K21L08E, 18P09K21L03Z, 18P09K21L03P, 18P09K21L03E, 18P09K21L04F, 18P09K21H19R, 18P09K21L09H, 18P09K21H24X, 18P09K21H24T, 18P09K21H24N, 18P09K21H19N, 18P09K21L09E, 18P09K21H14P, 18P09K21L10V, 18P09K21L10Q, 18P09K21L10A, 18P09K21H20V, 18P09K21H20A, 18P09K21H15Q, 18P09K21L10M, 18P09K21L10C, 18P09K21L05W, 18P09K21L05R, 18P09K21H25R, 18P09K21H25H, 18P09K21H20X, 18P09K21H20H, 18P09K21H15M, 18P09K21H25T, 18P09K21H25D, 18P09K21H20D, 18P09K21H15N, 18P09K21L15J, 18P09K21H20J, 18P09K21H10J, 18P09K21H10E, 18P09K22I01V, 18P09K22E16K, 18P09K22I06G, 18P09K22I01W, 18P09K22E21B, 18P09K22E16R, 18P09K22E06R, 18P09K22E06G, 18P09K22I11M, 18P09K22I11C, 18P09K22I06S, 18P09K22I06M, 18P09K22I01X, 18P09K22E16X, 18P09K22E16C, 18P09K22I11N, 18P09K22E21Y, 18P09K22E01Y, 18P09K22I11Z, 18P09K22I06Z, 18P09K22I06U, 18P09K22I01Z, 18P09K22E16J, 18P09K22E11J, 18P09K22E06Z, 18P09K22E06J, 18P09K22I02Q, 18P09K22I02K, 18P09K22E12A, 18P09K22I17B, 18P09K22I12G, 18P09K22E22W, 18P09K22E17R, 18P09K22E12L, 18P09K22E12B, 18P09K22E02W, 18P09K22E02R, 18P09K22I17N, 18P09K22I17C, 18P09K22I12C, 18P09K22I07T, 18P09K22I07I, 18P09K22I02I, 18P09K22E22X, 18P09K22E12C, 18P09K22E07S, 18P09K22E07T, 18P09K22I12U, 18P09K22I12E, 18P09K22I07U, 18P09K22I07P, 18P09K22I07J, 18P09K22E22J, 18P09K22E22E, 18P09K22I08Q, 18P09K22E23K, 18P09K22E18K, 18P09K22E13A, 18P09K22E08V, 18P09K22E03V, 18P09K22I18B, 18P09K22I13R, 18P09K22E18L, 18P09K22E03L, 18P09K22E03B, 18P09K22I18X, 18P09K22I18S, 18P09K22I13M, 18P09K22I03M, 18P09K22E18H, 18P09K22E13H, 18P09K22E13C, 18P09K22E08H, 18P09K22I13D, 18P09K22I03I, 18P09K22E18T, 18P09K22E18N, 18P09K22E13Y, 18P09K22E08Y, 18P09K22I13E, 18P09K22I08Z, 18P09K22I08E, 18P09K22I03J, 18P09K22E18E, 18P09K22E08Z, 18P09K22E03Z, 18P09K22E03J, 18P09K22I09K, 18P09K22A24K, 18P09K22I24B, 18P09K22I14R, 18P09K22I14G, 18P09K22I09R, 18P09K22I04W, 18P09K22E14W, 18P09K22E14G, 18P09K22E09B, 18P09K22A24R, 18P09K22A24G, 18P09K22I24M, 18P09K22I24H, 18P09K22I19H, 18P09K22I14S, 18P09K22I04H, 18P09K22E24X, 18P09K22E24H, 18P09K22E14X, 18P09K22E14C, 18P09K22E09C, 18P09K22E04X, 18P09K22E04H, 18P09K22I24Z, 18P09K22I19E, 18P09K22I14U, 18P09K22I14N, 18P09K22I09Y, 18P09K22I04Z, 18P09K22E19T, 18P09K22E19J, 18P09K22E19D, 18P09K22E19E, 18P09K22E09Z, 18P09K22E09J, 18P09K22E09E, 18P09K22E04N, 18P09K22A24U, 18P09K22I20F, 18P09K22I20A, 18P09K22I15K, 18P09K22I15F, 18P09K22I15A, 18P09K22E25Q, 18P09K22E20Q, 18P09K22E20F, 18P09K22E15K, 18P09K22E10Q, 18P09K22E05V, 18P09K22I15G, 18P09K22E25W, 18P09K22E25G, 18P09K22E25B, 18P09K22E15W, 18P09K22E10R, 18P09K22E05R, 18P09K22I15S, 18P09K22I15H, 18P09K22I10C, 18P09K22I05X, 18P09K22E20S, 18P09K22I10N, 18P09K22I05D, 18P09K22E25I, 18P09K22E15Y, 18P09K22E10T, 18P09K22E10N, 18P09K22E05I, 18P09K22M05P, 18P09K22I25E, 18P09K22I20Z, 18P09K22I20P, 18P09K22I15P, 18P09K22I05E, 18P09K22E20E, 18P09K22E15Z, 18P09K22E15P, 18P09K22E15E, 18P09K22N01A, 18P09K22J16Q, 18P09K22J11F, 18P09K22J11A, 18P09K22J06K, 18P09K22J06F, 18P09K22J06A, 18P09K22J01Q, 18P09K22F16Q, 18P09K22F06Q, 18P09K22J21R, 18P09K22J16W, 18P09K22J16G, 18P09K22J06W, 18P09K22J06G, 18P09K22N01X, 18P09K22J21S, 18P09K22J16X, 18P09K22J16C, 18P09K22J06X, 18P09K22J01S, 18P09K22F11X, 18P09K22F11M, 18P09K22F11H, 18P09K22F06X, 18P09K22F06S, 18P09K22N01Y, 18P09K22N01D, 18P09K22J11T, 18P09K22J06I, 18P09K22J01D, 18P09K22F11Y, 18P09K22F06T, 18P09K22N02V, 18P09K22J21J, 18P09K22J16Z, 18P09K22J16E, 18P09K22J12F, 18P09K22J07Q, 18P09K22J07F, 18P09K22J02Q, 18P09K22F21Z, 18P09K22F22Q, 18P09K22F21J, 18P09K22F11E, 18P09K22F12A, 18P09K22F06J, 18P09K22N02B, 18P09K22J22R, 18P09K22J12G, 18P09K22J07R, 18P09K22J07L, 18P09K22J02W, 18P09K22F22W, 18P09K22F12W, 18P09K22F12R, 18P09K22F12G, 18P09K22F07W, 18P09K22J22S, 18P09K22J17H, 18P09K22J12X, 18P09K22J12S, 18P09K22J12M, 18P09K22F22C, 18P09K22F12X, 18P09K22J17D, 18P09K22J12Y, 18P09K22J07Y, 18P09K22J07N, 18P09K22J02Y, 18P09K22F22I, 18P09K22F12I, 18P09K22J22Z, 18P09K22J02J, 18P09K22J02E, 18P09K22F17J, 18P09K22N03V, 18P09K22N03Q, 18P09K22F23K, 18P09K22J13G, 18P09K22N03C, 18P09K22J23S, 18P09K22J13S, 18P09K22F23M, 18P09K22F23C, 18P09K22F18X, 18P09K22F18H, 18P09K22N03T, 18P09K22N03I, 18P09K22F23Y, 18P09K22F18I, 18P09K22J23Z, 18P09K22J13Z, 18P09K22J13E, 18P09K22F18U, 18P09K22N04Q, 18P09K22J14W, 18P09K22F24Q, 18P09K22F19R, 18P09K22F19K, 18P09K22J19H, 18P09K22J14S, 18P09K22J14M, 18P09K22N04T, 18P09K22J14I, 18P09K22N04Z"]
    }
    
  ]

