const test=require('node:test');
const assert=require('node:assert/strict');
global.window=global;
require('../src/scanner.js');
const S=global.BFRadar;

test('parses npm dependencies across dependency groups and de-duplicates packages',()=>{
 const deps=S.parsePackageJson(JSON.stringify({dependencies:{react:'^19'},devDependencies:{vite:'^6',react:'^19'},peerDependencies:{zod:'*'},optionalDependencies:{sharp:'^1'}}));
 assert.deepEqual(deps.map(x=>x.name).sort(),['react','sharp','vite','zod']);
 assert.equal(deps.find(x=>x.name==='react').source,'dependencies');
});

test('parses Go module requirements and marks indirect modules',()=>{
 const deps=S.parseGoMod('module example.com/app\ngo 1.22\nrequire (\n github.com/acme/core v1.2.3\n golang.org/x/text v0.20.0 // indirect\n)\nrequire github.com/x/y v2.0.0\n');
 assert.equal(deps.length,3);assert.equal(deps.find(x=>x.name==='golang.org/x/text').indirect,true);assert.equal(deps.find(x=>x.name==='github.com/x/y').version,'v2.0.0');
});

test('parses pip pins, extras, direct URLs and ignores options/comments',()=>{
 const deps=S.parseRequirements('requests>=2.31\nrich[pretty]==13.8.0\n# comment\n--index-url https://pypi.org/simple\nmy-lib @ https://example.com/my-lib.whl\ngit+https://github.com/acme/tool.git#egg=tool');
 assert.deepEqual(deps.map(x=>x.name),['requests','rich','my-lib','tool']);
});

test('auto-detects common manifest formats and rejects unknown input',()=>{
 assert.equal(S.detectAndParse('{"dependencies":{"x":"1"}}').ecosystem,'npm');
 assert.equal(S.detectAndParse('module a.example/b\nrequire x.y/z v1.0.0').ecosystem,'go');
 assert.equal(S.detectAndParse('flask==3.0').ecosystem,'pypi');
 assert.throws(()=>S.detectAndParse('not a manifest'),/Could not recognize/);
});

test('extracts a GitHub owner/repository from common source URL formats',()=>{
 for(const [input,expected] of [['https://github.com/acme/project.git','acme/project'],['git+https://github.com/acme/project','acme/project'],['git@github.com:acme/project.git','acme/project'],['github.com/acme/project/tree/main','acme/project']]){const r=S.githubRepo(input);assert.equal(`${r.owner}/${r.repo}`,expected)}
 assert.equal(S.githubRepo('https://gitlab.com/acme/project'),null);
});

test('summarizes visible latest-commit authors without claiming full ownership',()=>{
 const m=S.latestCommitSignals([{commit:{author:{name:'A',date:'2025-01-01T00:00:00Z'}},author:{login:'alice'}},{commit:{author:{name:'B',date:'2025-01-02T00:00:00Z'}},author:{login:'bob'}},{commit:{author:{name:'A',date:'2025-01-03T00:00:00Z'}},author:{login:'alice'}}]);
 assert.equal(m.commitCount,3);assert.equal(m.visibleAuthors,2);assert.equal(m.authors[0].name,'alice');assert.equal(m.topShare,2/3);
});

test('unknown metadata is never scored as healthy or risky',()=>{
 const result=S.evaluateSignals({name:'unseen'},{ });assert.equal(result.band,'unknown');assert.equal(result.hasSignal,false);assert.equal(result.score,0);
});

test('staleness is measured against the newer public activity signal',()=>{
 const old='2022-01-01T00:00:00Z',recent=new Date().toISOString();
 assert.equal(S.evaluateSignals({}, {lastRelease:old,lastCommit:recent}).stale,false);
 assert.equal(S.evaluateSignals({}, {lastRelease:old}).stale,true);
});

test('aggregate numbers include only supported public signals',()=>{
 const s=S.summarize([{signals:{hasSignal:true,single:true,stale:false,score:40,band:'medium'}},{signals:{hasSignal:true,single:false,stale:true,score:35,band:'medium'}},{signals:{hasSignal:false,single:false,stale:false,score:0,band:'unknown'}}]);
 assert.equal(s.total,3);assert.equal(s.reviewed,2);assert.equal(s.single,1);assert.equal(s.stale,1);assert.equal(s.score,38);
});
