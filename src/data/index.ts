import scheduling, {arr2} from './scheduling'

let teams:string[] = [];
for (let i=1;i<=70;i++){
	teams.push(`T${i}`)
}

export {
	teams,
	scheduling,
	arr2,
}