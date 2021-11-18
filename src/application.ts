import {BootMixin} from '@loopback/boot';
import {Application, ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestComponent, RestServer} from '@loopback/rest';
import {RestExplorerBindings} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {EntityComponent, RestExplorerComponent, ValidatorsComponent} from './components';
import {Category} from './models';
import {CategoryRepository} from './repositories';
import {GenreRepository} from './repositories/genre.repository';
import {MySequence} from './sequence';
import {RabbitmqServer} from './servers';
import {ValidatorService} from './services/validator.service';

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

    this.component(RestExplorerComponent);
    this.component(ValidatorsComponent);
    this.component(EntityComponent);


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
    const genreRepo = this.getSync<GenreRepository>('repositories.GenreRepository');
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

    const validator = this.getSync<ValidatorService>('services.ValidatorService');
    try {
      await validator.validate({data: {id: '2-cat2'}, entityClass: Category});
    } catch (error) {
      console.dir(error, {depth: 8})
    }

    /*
    try {
      await validator.validate({data: {}, entityClass: Genre});
    } catch (error) {
      console.dir(error, {depth: 8})
    }
    */
  }
}
