

require("dotenv").config();


const os = require("os");
const { url } = require("inspector");
require('dotenv').config();

const EquiposGenerales = JSON.parse(process.env.EQUIPOS_GENERALES);

const NombreEquipo = os.hostname();
console.log(" Nombre del equipo: ", NombreEquipo);

const EquipoActual = EquiposGenerales[NombreEquipo];
console.log(" Equipo Actual: ", EquipoActual);