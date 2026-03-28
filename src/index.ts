import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IEditorLanguageRegistry } from '@jupyterlab/codemirror';
import {
  StreamLanguage,
  StreamParser,
  LanguageSupport
} from '@codemirror/language';

const DucklingLanguageParser: StreamParser<{ inString: boolean }> = {
  startState: () => ({ inString: false }),
  token: (stream, state) => {
    if (stream.eatSpace()) {
      return null;
    }
    if (stream.match(/^#.*/)) {
      return 'comment';
    }
    if (
      stream.match(
        /^(?:alias|and|as|assert|block|box|break|case|catch|class|compile_assert|const|continue|copy|debug|defer|dict|else|expand|extends|extern|false|for|fun|fundecl|if|implements|import|in|lambda|let|loop|match|move|namespace|none|not|or|pattern|private|protected|public|redo|ref|refof|restart|return|set|sizeof|static|str|switch|test|then|this|throw|true|try|type|using|var|vec|while|with|xor)\b/
      )
    ) {
      return 'keyword';
    }
    if (
      stream.match(
        /^(?:i8|i16|i32|i64|i128|u8|u16|u32|u64|u128|f16|f32|f64|f80|f128|char|bool|str|type|vec|set|dict|array)\b/
      )
    ) {
      return 'typeName';
    }
    if (stream.match(/^[0-9]+(?:\.[0-9]+)?/)) {
      return 'number';
    }
    if (stream.match(/^"[^"]*"/)) {
      return 'string';
    }
    if (stream.match(/^(?:\+|-|\*|\/|==|=|!=|>|<)/)) {
      return 'operator';
    }
    stream.next();
    return null;
  }
};

export const ducklingLanguage = StreamLanguage.define(DucklingLanguageParser);

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'duckling-syntax-highlighting:plugin',
  autoStart: true,
  requires: [IEditorLanguageRegistry],
  activate: (app: JupyterFrontEnd, languages: IEditorLanguageRegistry) => {
    console.log('JupyterLab extension jupyterlab_duckling_syntax_highlighting is activated!');
    languages.addLanguage({
      name: 'duckling',
      mime: 'text/x-duckling',
      extensions: ['duckling'],
      load: async () => {
        return new LanguageSupport(ducklingLanguage);
      }
    });
  }
};

export default plugin;
