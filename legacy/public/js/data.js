export const crops = [
  {id:'maize',name:'Maize',rate:50}, {id:'beans',name:'Beans',rate:25}, {id:'tomato',name:'Tomato',rate:40}
];
// Generic sample input kg/ha: deliberately not a product or treatment recommendation.
export function calculate(rate, hectares){if(!Number.isFinite(hectares)||hectares<=0||hectares>100000)throw new Error('Enter a field size above 0 and at most 100,000 hectares.');return rate*hectares;}
export const tree = {
 start:{question:'Where do you see the main symptom?',choices:[['🍃 Leaves','leaves'],['🌿 Stem or whole plant','stem'],['🍅 Fruit or pods','fruit']]},
 leaves:{question:'What do the leaves look like?',choices:[['Pale or yellow','yellow'],['Spots or patches','spots'],['Holes or chewed edges','chewed'],['Curled leaves','curl']]},
 yellow:{question:'Which leaves are affected first?',choices:[['Older, lower leaves','nitrogen'],['Newer, upper leaves','iron']]},
 spots:{question:'What type of spots?',choices:[['Rust-coloured specks','rust'],['Brown or dark patches','blight']]},
 stem:{question:'What stands out?',choices:[['Plant wilts','wilt'],['Stem has holes','borer'],['Plant is stunted','root']]},
 fruit:{question:'What damage do you see?',choices:[['Chewed fruit or pods','fruitworm'],['Dark sunken ends','rot']]},
 nitrogen:{title:'Possible nutrient stress',detail:'Yellow lower leaves can have several causes, including nitrogen stress. Record the pattern and ask an extension officer to assess soil and crop conditions.'},
 iron:{title:'Possible micronutrient stress',detail:'Pale new growth may indicate micronutrient stress or other growing conditions. Document leaf colour and soil conditions for review.'},
 rust:{title:'Possible rust-like symptoms',detail:'Rust-coloured specks merit closer inspection. Photograph both sides of leaves and seek crop-specific advice.'},
 blight:{title:'Possible leaf disease',detail:'Dark patches can have several causes. Record spread, recent weather and affected plants for an officer.'},
 chewed:{title:'Possible leaf-feeding pest',detail:'Inspect leaves for insects and record the amount of damage. Identification is needed before treatment.'},
 curl:{title:'Possible sucking pest or environmental stress',detail:'Inspect leaf undersides and record water conditions. Curling alone cannot identify the cause.'},
 wilt:{title:'Possible water or vascular stress',detail:'Check moisture and record when wilting occurs. Several diseases and growing conditions can produce this symptom.'},
 borer:{title:'Possible stem-boring pest',detail:'Record holes and visible insects. Ask an officer to confirm the cause.'},
 root:{title:'Possible root or growing-condition stress',detail:'Record soil moisture and the affected area. Stunting requires further assessment.'},
 fruitworm:{title:'Possible fruit-feeding pest',detail:'Document damage and visible insects for crop-specific identification.'},
 rot:{title:'Possible physiological or disease damage',detail:'Record fruit damage and watering patterns. Dark ends alone do not establish the cause.'}
};
