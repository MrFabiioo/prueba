import { service } from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
  HttpErrors,
} from '@loopback/rest';
import { request } from 'http';
import { Keys } from '../cconfiguracion/keys';
import {Credenciales, Persona} from '../models';
import {PersonaRepository} from '../repositories';
import { AutenticacionService } from '../services';
const fetch=require("node-fetch");

export class PersonaController {
  constructor(
    @repository(PersonaRepository)
    public personaRepository : PersonaRepository,
    @service(AutenticacionService)
    public servicioAutenticacion: AutenticacionService
  ) {}

  @post('/Registro')
  @response(200, {
    description: 'Persona model instance',
    content: {'application/json': {schema: getModelSchemaRef(Persona)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Persona, {
            title: 'NewPersona',
            exclude: ['id'],
          }),
        },
      },
    })
    persona: Omit<Persona, 'id'>,
  ): Promise<Persona> {
    let clave =this.servicioAutenticacion.generarClave();
    let claveEncriptada=this.servicioAutenticacion.encriptarClave(clave);
    persona.clave=claveEncriptada;
    let person=await this.personaRepository.create(persona);
    //notificacion de usuario
    let destino = person.correo;
    let asunto= "Registro en la APP - PEDIDOS";
    let contenido= `Hola, ${person.nombres}, su nombre de usuario es:${person.correo} y su clave es: ${clave}.` ;
      
    
    fetch(`${Keys.urlNotificacion}/email?email_destino=${destino}&asunto=${asunto}&mensaje=${contenido}`).then((data:any)=>{
      console.log(data)
    })
    return person;
    
  }

  @get('/personas/count')
  @response(200, {
    description: 'Persona model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Persona) where?: Where<Persona>,
  ): Promise<Count> {
    return this.personaRepository.count(where);
  }

  @get('/personas')
  @response(200, {
    description: 'Array of Persona model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Persona, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Persona) filter?: Filter<Persona>,
  ): Promise<Persona[]> {
    return this.personaRepository.find(filter);
  }

  @patch('/personas')
  @response(200, {
    description: 'Persona PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Persona, {partial: true}),
        },
      },
    })
    persona: Persona,
    @param.where(Persona) where?: Where<Persona>,
  ): Promise<Count> {
    return this.personaRepository.updateAll(persona, where);
  }

  @get('/personas/{id}')
  @response(200, {
    description: 'Persona model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Persona, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Persona, {exclude: 'where'}) filter?: FilterExcludingWhere<Persona>
  ): Promise<Persona> {
    return this.personaRepository.findById(id, filter);
  }

  @patch('/personas/{id}')
  @response(204, {
    description: 'Persona PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Persona, {partial: true}),
        },
      },
    })
    persona: Persona,
  ): Promise<void> {
    await this.personaRepository.updateById(id, persona);
  }

  @put('/personas/{id}')
  @response(204, {
    description: 'Persona PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() persona: Persona,
  ): Promise<void> {
    await this.personaRepository.replaceById(id, persona);
  }

  @del('/personas/{id}')
  @response(204, {
    description: 'Persona DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.personaRepository.deleteById(id);
  }
  //****metodos propios */

  @post("/Login")
  @response(200,{
      description:"Identificacion de usuarios"
    })

  async identificar(
    @requestBody() credenciales:Credenciales
  ):Promise<Persona |  null>{
    let persona=await this.personaRepository.findOne({
      where:{
        correo:credenciales.user,
        clave:credenciales.password
      }
    });
    return persona;
  }

  @post("/LoginT")
  @response(200,{
    description:"Identificacion de personas con token"
  })
  async identificarConToken(
    @requestBody()credenciales:Credenciales
  ){
    credenciales.password=this.servicioAutenticacion.encriptarClave(credenciales.password)
    let p= await this.servicioAutenticacion.IdentificarPersona(credenciales)
    if (p) {
      let token = this.servicioAutenticacion.GenerarToken(p)
      return {
        datos:{
          nombre: p.nombres,
          correo: p.correo,
          id: p.id
        },
        tk:token
      }
    } else {
      throw new HttpErrors[401]("Datos Invalidos");
    }
  }
}
