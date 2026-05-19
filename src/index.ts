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

type DucklingState = {
  inString: boolean;
  inFString: boolean;
  bracketsInsideStringDepth: number;
  blockCommentDepth: number;
};

const keywordRegex =
  /^(?:if|else|then|while|for|match|case|pattern|in|break|continue|result|defer|import|export|from|as|return|static|lambda|this|extends|implements|override|create|destroy|public|private|protected|pure|virtual|async|threadsafe|unique|leaking|debug|test|move|expand)\b/;
const declarationRegex =
  /^(?:var|let|const|fun|class|interface|namespace|block|template|macro|alias|using)\b/;
const typeRegex =
  /^(?:type|i8|i16|i32|i64|i128|u8|u16|u32|u64|u128|f16|f32|f64|f80|f128|void|unit|bool|byte|char|str)\b/;
const constantRegex = /^(?:true|false|null)\b/;
const operatorWordRegex = /^(?:and|or|not|ref|box)\b/;
const attributeRegex = /^@(in|out|invariant|nodiscard|noreturn)\b/;

const DucklingLanguageParser: StreamParser<DucklingState> = {
  startState: () => ({
    inString: false,
    inFString: false,
    bracketsInsideStringDepth: 0,
    blockCommentDepth: 0
  }),
  token: (stream, state) => {
    if (state.blockCommentDepth > 0) {
      if (stream.match(/^#\{/)) {
        state.blockCommentDepth += 1;
        return 'comment';
      }
      if (stream.match(/^#\}/)) {
        state.blockCommentDepth -= 1;
        return 'comment';
      }
      stream.next();
      return 'comment';
    }

    if (state.bracketsInsideStringDepth > 0) {
      if (stream.match(/^{/)) {
        state.bracketsInsideStringDepth += 1;
        return null;
      }
      if (stream.match(/^}/)) {
        state.bracketsInsideStringDepth -= 1;
        return null;
      }
    }

    if (state.inString && state.bracketsInsideStringDepth === 0) {
      if (stream.match(/^\\./)) {
        // Match \ and next character to avoid exiting string in case of \".
        return 'string';
      }
      if (state.inFString && stream.peek() === '{') {
        stream.next();
        state.bracketsInsideStringDepth = 1;
        return null;
      }
      const nextChar = stream.next();
      if (nextChar === '"') {
        state.inString = false;
        state.inFString = false;
      }
      return 'string';
    }

    if (stream.eatSpace()) {
      return null;
    }

    if (stream.match(/^#\{/)) {
      state.blockCommentDepth = 1;
      return 'comment';
    }
    if (stream.match(/^#.*/)) {
      return 'comment';
    }

    if (stream.match(/^f"/)) {
      state.inString = true;
      state.inFString = true;
      state.bracketsInsideStringDepth = 0;
      return 'string';
    }
    if (stream.match(/^"/)) {
      state.inString = true;
      state.inFString = false;
      state.bracketsInsideStringDepth = 0;
      return 'string';
    }

    if (stream.match(attributeRegex)) {
      return 'keyword';
    }
    if (stream.match(keywordRegex)) {
      return 'keyword';
    }
    if (stream.match(declarationRegex)) {
      return 'keyword';
    }
    if (stream.match(typeRegex)) {
      return 'keyword';
    }
    if (stream.match(constantRegex)) {
      return 'atom';
    }
    if (stream.match(operatorWordRegex)) {
      return 'operator';
    }

    if (stream.match(/^0b[01]+/)) {
      return 'number';
    }
    if (stream.match(/^0o[0-7]+/)) {
      return 'number';
    }
    if (stream.match(/^0x[0-9A-Fa-f]+/)) {
      return 'number';
    }
    if (stream.match(/^[0-9]+\.[0-9]*([eE][+-]?[0-9]+)?/)) {
      return 'number';
    }
    if (stream.match(/^[0-9]*\.[0-9]+([eE][+-]?[0-9]+)?/)) {
      return 'number';
    }
    if (stream.match(/^[0-9]+[eE][+-]?[0-9]+/)) {
      return 'number';
    }
    if (stream.match(/^\b[0-9]+\b/)) {
      return 'number';
    }

    if (stream.match(/^[_a-zA-Z][_a-zA-Z0-9]*(?=\s*\()/)) {
      return 'function';
    }

    const identifier = stream.match(/^[_a-zA-Z][_a-zA-Z0-9]*/);
    if (identifier) {
      if (!stream.match(/^\s*(?:\.|::)/, false)) {
        return 'variableName';
      }
      return null;
    }

    if (stream.match(/^[+\-/*%=><|^*&@]/)) {
      return 'operator';
    }
    if (stream.match(/^[;:,]/)) {
      return null;
    }
    if (stream.match(/^(\[|\]|\(|\)|\{|\})/)) {
      return null;
    }
    if (stream.match(/^\./)) {
      return null;
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
    console.log(
      'JupyterLab extension jupyterlab_duckling_syntax_highlighting is activated!'
    );
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
