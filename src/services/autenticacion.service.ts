import { injectable, /* inject, */ BindingScope } from '@loopback/core';
import { repository } from '@loopback/repository';
import { Credenciales, Persona } from '../models';
import { PersonaRepository } from '../repositories';
import { Keys } from '../cconfiguracion/keys';
const generator = require("generate-password");
const cryptoJs = require("crypto-js");
const JWT = require("jsonwebtoken")
@injectable({ scope: BindingScope.TRANSIENT })
export class AutenticacionService {
  constructor(
    @repository(PersonaRepository)
    public personaRepositorio: PersonaRepository
  ) { }

  /*
   * Add service methods here
   */
  generarClave() {
    let pass = generator.generate({
      length: 10,
      numbers: true
    });
    return pass;
  }
  encriptarClave(pass: string) {
    let passEncriptado = cryptoJs.MD5(pass).toString();
    return passEncriptado
  }

  IdentificarPersona(credenciales: Credenciales) {
    try {
      let p = this.personaRepositorio.findOne({
        where: {
          correo: credenciales.user,
          clave: credenciales.password
        }

      })
      return p
    } catch {
      return false
    }
  }

  GenerarToken(persona: Persona) {
    let token = JWT.sign({
      data: {
        id: persona.id,
        correo: persona.correo,
        nombre: persona.nombres + " " + persona.apellidos
      }

    },
      Keys.firmaJwt);
    return token;
  }

  ValidacionToken(token: string) {
    try {
      let datos = JWT.verify(token, Keys.firmaJwt);
      return datos;
    } catch {
      return false;
    }
  }

}
