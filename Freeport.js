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
    // , {
    //   NombreArea: "511210",
    //   Referencia: "18N05E04A03C",
    //   Celdas: ["18N05E04A03C, 18N05A24M13S, 18N05A24M18Z, 18N05A24M18I, 18N05A24M19V, 18N05A24M19F, 18N05A24M14Q, 18N05A24M24L, 18N05A24M24H, 18N05A24M19S, 18N05A24M19M, 18N05A24M19H, 18N05A24M24Y, 18N05A24M24D, 18N05A24M24J, 18N05A24M20R, 18N05A24M25C, 18N05A24M20X, 18N05A24M25D, 18N05A24M23X, 18N05A24M23S, 18N05A24M18H, 18N05A24M14K, 18N05A24M19L, 18N05A24M19G, 18N05A24M25Q, 18N05E04A05B, 18N05A24M23M, 18N05A24M18M, 18N05A24M13X, 18N05A24M13M, 18N05A24M23T, 18N05A24M23D, 18N05A24M18Y, 18N05A24M18P, 18N05A24M18J, 18N05A24M13U, 18N05E04A04B, 18N05A24M19Y, 18N05E04A05A, 18N05A24M20F, 18N05A24M25L, 18N05A24M20W, 18N05A24M25M, 18N05A24M25T, 18N05A24M18U, 18N05A24M18N, 18N05A24M18D, 18N05A24M18E, 18N05A24M13T, 18N05A24M24F, 18N05A24M24A, 18N05A24M14V, 18N05A24M24X, 18N05A24M19C, 18N05A24M19T, 18N05A24M24P, 18N05A24M25K, 18N05A24M23C, 18N05A24M18X, 18N05E04A03E, 18N05A24M23Y, 18N05A24M23Z, 18N05A24M23E, 18N05A24M19Q, 18N05A24M19K, 18N05A24M24B, 18N05A24M19R, 18N05E04A04D, 18N05A24M24T, 18N05A24M19Z, 18N05A24M25A, 18N05A24M20Q, 18N05A24M25B, 18N05A24M25H, 18N05A24M25I, 18N05A24M23U, 18N05A24M23I, 18N05A24M13Y, 18N05A24M24V, 18N05A24M19W, 18N05A24M14W, 18N05E04A04C, 18N05A24M24M, 18N05A24M19X, 18N05A24M19J, 18N05A24M25W, 18N05A24M25G, 18N05A24M25S, 18N05A24M20S, 18N05A24M25N, 18N05A24M23H, 18N05A24M23P, 18N05A24M23J, 18N05A24M18T, 18N05A24M13Z, 18N05A24M13P, 18N05A24M24K, 18N05A24M19A, 18N05A24M24W, 18N05A24M19B, 18N05A24M24S, 18N05A24M24C, 18N05A24M24N, 18N05A24M19I, 18N05E04A04E, 18N05A24M24Z, 18N05A24M24U, 18N05A24M19U, 18N05A24M25R, 18N05A24M25X, 18N05A24M18S, 18N05A24M18C, 18N05E04A03D, 18N05A24M23N, 18N05A24M13N, 18N05E04A04A, 18N05A24M24Q, 18N05A24M24R, 18N05A24M24G, 18N05A24M24I, 18N05A24M19N, 18N05A24M24E, 18N05A24M19P, 18N05A24M25V, 18N05A24M25F, 18N05A24M20V, 18N05A24M20K"]
    // }
    , {
      NombreArea: "507945",
      Referencia: "18P09K04M20C",
      Celdas: ["18P09K04M20C, 18P09K04M20N, 18P09K04N16K, 18P09K04N11R, 18P09K04N11L, 18P09K04N16N, 18P09K04N11Z, 18P09K04N17L, 18P09K04N17G, 18P09K04N17S, 18P09K04N17C, 18P09K04N12S, 18P09K04N12Z, 18P09K04M20S, 18P09K04M15Y, 18P09K04M20P, 18P09K04N11V, 18P09K04N16R, 18P09K04N16G, 18P09K04N16S, 18P09K04N11X, 18P09K04N12V, 18P09K04N12X, 18P09K04N17D, 18P09K04N12Y, 18P09K04N17J, 18P09K04N12U, 18P09K04N12P, 18P09K04N18Q, 18P09K04N13V, 18P09K04N18G, 18P09K04M20U, 18P09K04M15U, 18P09K04N16A, 18P09K04N11K, 18P09K04N16C, 18P09K04N16D, 18P09K04N11Y, 18P09K04N17F, 18P09K04N12K, 18P09K04N17H, 18P09K04N17N, 18P09K04N12T, 18P09K04M20D, 18P09K04M20J, 18P09K04N16L, 18P09K04N11W, 18P09K04N16H, 18P09K04N11S, 18P09K04N16J, 18P09K04N16E, 18P09K04N17R, 18P09K04N12W, 18P09K04N12L, 18P09K04N17M, 18P09K04N17T, 18P09K04N13Q, 18P09K04N13K, 18P09K04N18B, 18P09K04N13W, 18P09K04N13S, 18P09K04N13M, 18P09K04M20X, 18P09K04M20M, 18P09K04M20T, 18P09K04M20I, 18P09K04M20Z, 18P09K04N16Q, 18P09K04N16X, 18P09K04N16Z, 18P09K04N17A, 18P09K04N17W, 18P09K04N18A, 18P09K04N18W, 18P09K04M20Y, 18P09K04M15T, 18P09K04M15N, 18P09K04M15Z, 18P09K04N11Q, 18P09K04N16B, 18P09K04N16I, 18P09K04N11M, 18P09K04N11N, 18P09K04N12R, 18P09K04N17U, 18P09K04N18V, 18P09K04N18L, 18P09K04N13L, 18P09K04M15P, 18P09K04N16W, 18P09K04N16Y, 18P09K04N16M, 18P09K04N16U, 18P09K04N12Q, 18P09K04N17X, 18P09K04N17Y, 18P09K04N12N, 18P09K04N18K, 18P09K04N18F, 18P09K04M20H, 18P09K04M20E, 18P09K04N16V, 18P09K04N16F, 18P09K04N16T, 18P09K04N11T, 18P09K04N16P, 18P09K04N11U, 18P09K04N11P, 18P09K04N17V, 18P09K04N17Q, 18P09K04N17K, 18P09K04N17B, 18P09K04N12M, 18P09K04N17I, 18P09K04N17Z, 18P09K04N17P, 18P09K04N17E, 18P09K04N18R, 18P09K04N13R"]
    }, {
      NombreArea: "508391",
      Referencia: "18P09K04N18H",
      Celdas: ["18P09K04N18H, 18P09K04N18Y, 18P09K04N18N, 18P09K04N19Z, 18P09K04N19P, 18P09K04N20H, 18P09K04N20I, 18P09K04N20U, 18P09K04P16V, 18P09K04P16W, 18P09K04P16S, 18P09K04P16H, 18P09K04P16D, 18P09K04P16J, 18P09K04P16E, 18P09K04P17V, 18P09K04P17W, 18P09K04P17S, 18P09K04P18F, 18P09K04P18U, 18P09K09C04Q, 18P09K04P19F, 18P09K09C14G, 18P09K09C09R, 18P09K04P19B, 18P09K09C04S, 18P09K04P19H, 18P09K04P19T, 18P09K09C04Z, 18P09K04P24U, 18P09K09C05K, 18P09K09C05F, 18P09K09C05A, 18P09K04P25F, 18P09K04P20A, 18P09K09C05S, 18P09K09C05G, 18P09K09C05B, 18P09K09C10Y, 18P09K09C10I, 18P09K04P20Y, 18P09K09C10E, 18P09K09C05E, 18P09K04P25P, 18P09K04P20U, 18P09K09D11A, 18P09K09D01K, 18P09K09D01X, 18P09K09D01M, 18P09K04Q21S, 18P09K04Q16M, 18P09K09D11D, 18P09K09D06I, 18P09K09D01D, 18P09K09D06Z, 18P09K09D01Z, 18P09K09D01E, 18P09K09D12F, 18P09K09D07F, 18P09K09D02F, 18P09K04Q17F, 18P09K09D07R, 18P09K04Q17W, 18P09K04Q17R, 18P09K04N18U, 18P09K04N19Q, 18P09K04N19K, 18P09K04N19B, 18P09K04N20Y, 18P09K04N20P, 18P09K04P16R, 18P09K04P16T, 18P09K04P16N, 18P09K04P17L, 18P09K04P17X, 18P09K04P18A, 18P09K09C09K, 18P09K09C04F, 18P09K04P24F, 18P09K09C04R, 18P09K04P24S, 18P09K04P19N, 18P09K09C09J, 18P09K09C04U, 18P09K04P20Q, 18P09K04P20F, 18P09K09C10W, 18P09K09C05R, 18P09K04P25H, 18P09K04P20X, 18P09K09C10D, 18P09K09C05N, 18P09K04P25Y, 18P09K04P25N, 18P09K09C10U, 18P09K09C05P, 18P09K04P20P, 18P09K04P20E, 18P09K09D06L, 18P09K09D01G, 18P09K04Q21L, 18P09K04Q21B, 18P09K04Q16R, 18P09K09D01S, 18P09K04Q21M, 18P09K04Q16C, 18P09K09D01N, 18P09K04Q21D, 18P09K09D06U, 18P09K04Q21P, 18P09K04Q16U, 18P09K09D07V, 18P09K09D07Q, 18P09K09D07A, 18P09K09D02Q, 18P09K04Q22V, 18P09K09D07W, 18P09K09D02L, 18P09K09D02G, 18P09K04Q22H, 18P09K04Q17H, 18P09K04N18I, 18P09K04N18D, 18P09K04N19A, 18P09K04N19I, 18P09K04N19U, 18P09K04N20A, 18P09K04N20X, 18P09K04N20D, 18P09K04P16F, 18P09K04P16U, 18P09K04P17G, 18P09K04P17B, 18P09K04P17H, 18P09K04P17N, 18P09K04P17J, 18P09K04P18L, 18P09K04P18M, 18P09K09C09V, 18P09K04P24K, 18P09K09C09L, 18P09K04P24W, 18P09K04P19R, 18P09K04P19L, 18P09K09C14C, 18P09K09C04M, 18P09K04P24X, 18P09K09C09D, 18P09K09C04Y, 18P09K09C04N, 18P09K04P24T, 18P09K04P24I, 18P09K09C09Z, 18P09K09C09E, 18P09K04P24E, 18P09K04P19J, 18P09K09C15A, 18P09K09C10F, 18P09K04P25V, 18P09K04P25A, 18P09K09C15H, 18P09K09C10X, 18P09K09C10G, 18P09K09C10B, 18P09K09C10C, 18P09K09C05C, 18P09K04P25W, 18P09K04P25M, 18P09K04P25G, 18P09K04P20B, 18P09K09C15D, 18P09K09C05I, 18P09K09C05D, 18P09K04P20I, 18P09K09D06V, 18P09K04Q16A, 18P09K09D01L, 18P09K04Q21W, 18P09K04Q21R, 18P09K04Q21C, 18P09K04Q16S, 18P09K04Q11Y, 18P09K09D01P, 18P09K04Q21J, 18P09K04Q21E, 18P09K04Q22F, 18P09K04Q22A, 18P09K09D07G, 18P09K04Q22B, 18P09K09D07X, 18P09K09D07C, 18P09K09D02M, 18P09K04Q17C, 18P09K04N18J, 18P09K04N19V, 18P09K04N19W, 18P09K04N19R, 18P09K04N19X, 18P09K04N20Q, 18P09K04N20M, 18P09K04P17F, 18P09K04P17Y, 18P09K04P17T, 18P09K04P17I, 18P09K04P17D, 18P09K04P17U, 18P09K04P17E, 18P09K04P18Q, 18P09K04P18W, 18P09K04P18R, 18P09K04P18K, 18P09K04P18D, 18P09K04P18P, 18P09K04P19Q, 18P09K09C09B, 18P09K04P19G, 18P09K09C09C, 18P09K09C04X, 18P09K04P24M, 18P09K04P24C, 18P09K04P19X, 18P09K09C14I, 18P09K09C09N, 18P09K04P24D, 18P09K04P19D, 18P09K09C14J, 18P09K04P24P, 18P09K04P19P, 18P09K09C10V, 18P09K09C10A, 18P09K09C15G, 18P09K09C10S, 18P09K09C05W, 18P09K09C05H, 18P09K04P25X, 18P09K04P20G, 18P09K09C10P, 18P09K04P25Z, 18P09K04P25U, 18P09K04P25E, 18P09K09D11F, 18P09K09D06Q, 18P09K04Q21K, 18P09K04Q21F, 18P09K04Q21A, 18P09K04Q16F, 18P09K04Q16W, 18P09K04Q16G, 18P09K09D01C, 18P09K09D06T, 18P09K09D01T, 18P09K04Q21T, 18P09K09D01J, 18P09K04Q21U, 18P09K04Q16Z, 18P09K09D07K, 18P09K09D02K, 18P09K04Q22Q, 18P09K09D07L, 18P09K09D07B, 18P09K09D02B, 18P09K04Q17G, 18P09K09D02S, 18P09K09D02C, 18P09K04Q22X, 18P09K04N18M, 18P09K04N18T, 18P09K04N18E, 18P09K04N19G, 18P09K04N19S, 18P09K04N19Y, 18P09K04N20R, 18P09K04N20G, 18P09K04N20Z, 18P09K04P16K, 18P09K04P16G, 18P09K04P16B, 18P09K04P16Z, 18P09K04P17Q, 18P09K04P17K, 18P09K04P17R, 18P09K04P17Z, 18P09K04P17P, 18P09K04P18V, 18P09K04P18G, 18P09K04P18B, 18P09K04P18T, 18P09K09C09W, 18P09K09C04W, 18P09K09C04L, 18P09K09C04B, 18P09K04P24R, 18P09K04P24L, 18P09K09C04H, 18P09K04P24H, 18P09K04P19S, 18P09K04P19C, 18P09K09C14D, 18P09K09C09T, 18P09K04P24Y, 18P09K04P24N, 18P09K09C09U, 18P09K09C04E, 18P09K09C15F, 18P09K09C10K, 18P09K04P25K, 18P09K04P20K, 18P09K09C10L, 18P09K09C05X, 18P09K09C05M, 18P09K04P25R, 18P09K04P25L, 18P09K04P25B, 18P09K04P20M, 18P09K09C15I, 18P09K09C10T, 18P09K09C05T, 18P09K04P25D, 18P09K04P20N, 18P09K04P20D, 18P09K09C15J, 18P09K09C05U, 18P09K04P25J, 18P09K04P20Z, 18P09K09D06A, 18P09K09D01Q, 18P09K09D01F, 18P09K04Q21Q, 18P09K04Q16Q, 18P09K09D11G, 18P09K09D06G, 18P09K09D06B, 18P09K09D01R, 18P09K09D06S, 18P09K04Q21X, 18P09K04Q16X, 18P09K04Q16H, 18P09K04Q21Y, 18P09K04Q16I, 18P09K04Q16D, 18P09K04Q21Z, 18P09K04Q11Z, 18P09K09D02V, 18P09K04Q17K, 18P09K04Q22G, 18P09K09D12H, 18P09K09D07H, 18P09K04Q22M, 18P09K04Q17X, 18P09K04N18X, 18P09K04N18S, 18P09K04N18C, 18P09K04N18P, 18P09K04N19L, 18P09K04N19C, 18P09K04N20V, 18P09K04N20W, 18P09K04N20B, 18P09K04N20C, 18P09K04N20T, 18P09K04P16Q, 18P09K04N20E, 18P09K04P16A, 18P09K04P17A, 18P09K04P18S, 18P09K04P18Y, 18P09K04P18N, 18P09K04P18I, 18P09K04P18Z, 18P09K09C04V, 18P09K04P24Q, 18P09K04P19A, 18P09K09C14B, 18P09K04P24B, 18P09K04P19W, 18P09K09C09X, 18P09K09C09I, 18P09K09C04D, 18P09K09C14E, 18P09K04P20V, 18P09K09C10R, 18P09K09C05L, 18P09K04P25S, 18P09K04P25T, 18P09K04P20T, 18P09K09C15E, 18P09K09C10Z, 18P09K09D01V, 18P09K04Q21V, 18P09K09D06R, 18P09K04Q21G, 18P09K09D11H, 18P09K09D11C, 18P09K09D06X, 18P09K09D06C, 18P09K04Q21H, 18P09K09D01Y, 18P09K09D01I, 18P09K04Q21N, 18P09K04Q21I, 18P09K04Q16T, 18P09K04Q16N, 18P09K09D06P, 18P09K09D12A, 18P09K09D02A, 18P09K04Q22K, 18P09K04Q12V, 18P09K09D12B, 18P09K09D02W, 18P09K09D02R, 18P09K04Q22R, 18P09K04Q17B, 18P09K09D02X, 18P09K04Q22S, 18P09K04Q22C, 18P09K04Q17M, 18P09K04N18Z, 18P09K04N19F, 18P09K04N19J, 18P09K04N19E, 18P09K04N20K, 18P09K04N20F, 18P09K04N20S, 18P09K04N20N, 18P09K04N20J, 18P09K04P16P, 18P09K04P17C, 18P09K04P18C, 18P09K09C09Q, 18P09K09C09A, 18P09K09C04A, 18P09K04P24V, 18P09K04P19V, 18P09K09C09G, 18P09K09C04G, 18P09K09C14H, 18P09K09C09H, 18P09K09C09Y, 18P09K04P19I, 18P09K09C09P, 18P09K04P24J, 18P09K04P19Z, 18P09K09C10Q, 18P09K04P25Q, 18P09K09C15B, 18P09K09C15C, 18P09K09C10H, 18P09K04P20W, 18P09K04P20R, 18P09K04P20S, 18P09K04P20H, 18P09K04P20C, 18P09K09C10N, 18P09K04P25I, 18P09K09C10J, 18P09K09C05J, 18P09K04P20J, 18P09K09D06F, 18P09K04Q16K, 18P09K09D06W, 18P09K09D01B, 18P09K04Q16B, 18P09K09D06M, 18P09K09D06H, 18P09K09D01H, 18P09K09D06N, 18P09K09D11J, 18P09K09D11E, 18P09K09D06J, 18P09K09D06E, 18P09K09D01U, 18P09K04Q16P, 18P09K04Q17V, 18P09K04Q22L, 18P09K04Q12W, 18P09K09D12C, 18P09K09D07S, 18P09K04Q12X, 18P09K04N19M, 18P09K04N19H, 18P09K04N19T, 18P09K04N19N, 18P09K04N19D, 18P09K04N20L, 18P09K04P16L, 18P09K04P16X, 18P09K04P16M, 18P09K04P16C, 18P09K04P16Y, 18P09K04P16I, 18P09K04P17M, 18P09K04P18X, 18P09K04P18H, 18P09K04P18J, 18P09K04P18E, 18P09K09C14F, 18P09K09C14A, 18P09K09C09F, 18P09K09C04K, 18P09K04P24A, 18P09K04P19K, 18P09K04P24G, 18P09K09C09S, 18P09K09C09M, 18P09K09C04C, 18P09K04P19M, 18P09K09C04T, 18P09K09C04I, 18P09K04P19Y, 18P09K09C04P, 18P09K09C04J, 18P09K04P24Z, 18P09K04P19U, 18P09K04P19E, 18P09K09C05V, 18P09K09C05Q, 18P09K09C10M, 18P09K04P25C, 18P09K04P20L, 18P09K09C05Y, 18P09K09C05Z, 18P09K09D06K, 18P09K09D01A, 18P09K04Q16V, 18P09K09D11B, 18P09K09D01W, 18P09K04Q16L, 18P09K04Q11X, 18P09K09D11I, 18P09K09D06Y, 18P09K09D06D, 18P09K04Q16Y, 18P09K04Q16J, 18P09K04Q16E, 18P09K04Q17Q, 18P09K04Q17A, 18P09K09D12G, 18P09K04Q22W, 18P09K04Q17L, 18P09K09D07M, 18P09K09D02H, 18P09K04Q17S"]
    }, {
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
    , {
      NombreArea: "511666",
      Referencia: "18P09K04B20E",
      Celdas: ["18P09K04B10N, 18P09K04B20E, 18P09K04C06V, 18P09K04C11S, 18P09K04C11T, 18P09K04C11D, 18P09K04C06N, 18P09K04B10T, 18P09K04C06F, 18P09K04C06G, 18P09K04C16D, 18P09K04C06T, 18P09K04B15N, 18P09K04C11K, 18P09K04B10Z, 18P09K04C06K, 18P09K04C16B, 18P09K04C11R, 18P09K04C06W, 18P09K04C16C, 18P09K04C06X, 18P09K04B10Y, 18P09K04B15E, 18P09K04C06Q, 18P09K04B10J, 18P09K04C11G, 18P09K04C11B, 18P09K04C06S, 18P09K04C11Y, 18P09K04C11N, 18P09K04C06I, 18P09K04B20I, 18P09K04B20D, 18P09K04B15T, 18P09K04B15Z, 18P09K04C11Q, 18P09K04C11A, 18P09K04C11W, 18P09K04C11L, 18P09K04C06L, 18P09K04C11M, 18P09K04C11I, 18P09K04B15I, 18P09K04B10I, 18P09K04B20J, 18P09K04B10P, 18P09K04C06M, 18P09K04C16I, 18P09K04B15Y, 18P09K04C16F, 18P09K04C11V, 18P09K04B15U, 18P09K04C11F, 18P09K04B10U, 18P09K04C11X, 18P09K04B15D, 18P09K04C16A, 18P09K04B15P, 18P09K04B15J, 18P09K04C16G, 18P09K04C06R, 18P09K04C16H, 18P09K04C11H, 18P09K04C11C, 18P09K04C06H, 18P09K04C06Y"]
    }, {
      NombreArea: "511665",
      Referencia: "18P09K04C12C",
      Celdas: ["18P09K04C16E, 18P09K04C11J, 18P09K04C17A, 18P09K04C12Q, 18P09K04C12K, 18P09K04C12R, 18P09K04C12G, 18P09K04C07R, 18P09K04C07G, 18P09K04C12H, 18P09K04C12C, 18P09K04C07H, 18P09K04C07N, 18P09K04C11U, 18P09K04C12F, 18P09K04C12L, 18P09K04C12B, 18P09K04C17H, 18P09K04C07X, 18P09K04C12I, 18P09K04C07Y, 18P09K04C17J, 18P09K04C07Z, 18P09K04C11E, 18P09K04C17F, 18P09K04C12A, 18P09K04C17B, 18P09K04C12D, 18P09K04C07T, 18P09K04C12J, 18P09K04C07P, 18P09K04C07F, 18P09K04C12W, 18P09K04C07M, 18P09K04C17I, 18P09K04C12U, 18P09K04C07U, 18P09K04C12V, 18P09K04C17G, 18P09K04C07W, 18P09K04C17C, 18P09K04C12M, 18P09K04C07S, 18P09K04C12Z, 18P09K04C07J, 18P09K04C11Z, 18P09K04C11P, 18P09K04C06U, 18P09K04C07V, 18P09K04C07Q, 18P09K04C16J, 18P09K04C06Z, 18P09K04C06P, 18P09K04C06J, 18P09K04C12X, 18P09K04C17D, 18P09K04C12Y, 18P09K04C12T, 18P09K04C17E, 18P09K04C12P, 18P09K04C07K, 18P09K04C07L, 18P09K04C12S, 18P09K04C12N, 18P09K04C07I, 18P09K04C12E"]
    }
  ]

