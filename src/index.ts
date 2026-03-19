import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * Initialization data for the jupyterlab_duckling_syntax_highlighting extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_duckling_syntax_highlighting:plugin',
  description: 'Adds duckling syntax highlighting for jupyter notebooks.',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension jupyterlab_duckling_syntax_highlighting is activated!');
  }
};

export default plugin;
