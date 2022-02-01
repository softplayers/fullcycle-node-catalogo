import {AuthenticationComponent} from '@loopback/authentication';
import {JWTAuthenticationComponent, TokenServiceBindings} from '@loopback/authentication-jwt';
import {BootMixin} from '@loopback/boot';
import {Application, ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestBindings, RestComponent, RestServer} from '@loopback/rest';
import {RestExplorerBindings} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {EntityComponent, RestExplorerComponent, ValidatorsComponent} from './components';
import {ApiResourceProvider} from './providers/api-resource.providers';
import {MySequence} from './sequence';
import {RabbitmqServer} from './servers';
import {JWTService} from './services/auth/jwt.service';

export {ApplicationConfig};

export class FullcycleNodeCatalogoApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(Application)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    options.rest.sequence = MySequence;

    this.component(RestComponent);

    // Set up default home page
    const restServer = this.getSync<RestServer>('servers.RestServer');
    restServer.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here

    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });

    this.bind(RestBindings.SequenceActions.SEND).toProvider(ApiResourceProvider);

    this.component(RestExplorerComponent);
    this.component(ValidatorsComponent);
    this.component(EntityComponent);
    this.component(AuthenticationComponent);
    this.component(JWTAuthenticationComponent);
    this.bind(TokenServiceBindings.TOKEN_SERVICE).toClass(JWTService);


    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
    this.server(RabbitmqServer)
  }

  async boot() {
    await super.boot();

    // Test Update category in genre
    /* const genreRepo = this.getSync<GenreRepository>('repositories.GenreRepository');
    genreRepo.updateRelation('categories', {
      id: '1',
      name: 'Categoria 3333333333333333333333333333333333',
      is_active: true
    })

    const catRepo = this.getSync<CategoryRepository>('repositories.CategoryRepository');
    const cats = await catRepo.find({where: {id: '1-cat'}});
    const cat = cats[0]
    console.log('[BOOT]', cat);
    catRepo.updateById(cat.id, {...cat, name: 'Funcionando no Loopback'});

    return;
    */

    // Test 2
    /* const validator = this.getSync<ValidatorService>('services.ValidatorService');
    try {
      await validator.validate({data: {id: '2-cat2'}, entityClass: Category});
    } catch (error) {
      console.dir(error, {depth: 8})
    }
    */

    // Test 3
    /*
    try {
      await validator.validate({data: {}, entityClass: Genre});
    } catch (error) {
      console.dir(error, {depth: 8})
    }
    */
  }
}
