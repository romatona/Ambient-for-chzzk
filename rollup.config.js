import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
export default ['content','demo','popup'].map(name=>({
 input:`src/scripts/chizambi/${name}.js`,
 output:{file:`dist/scripts/${name}.js`,format:'iife',sourcemap:true},
 plugins:[resolve(),babel({babelHelpers:'bundled',comments:true,plugins:[['@babel/plugin-proposal-class-properties',{loose:true}],'@babel/plugin-proposal-optional-chaining']})]
}));
