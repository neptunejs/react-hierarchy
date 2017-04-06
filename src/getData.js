import {stratify} from 'd3-hierarchy';

export default function getData() {
    return fetch('data.json').then(r => r.json()).then(function (data) {
        const distance = data.distance;
        const meta = data.meta;//.slice(0, 100);

        const n = meta.length;
        const indexCalc = getIndexCalculator(n);

        return stratify()
            .id(el => el.name)
            .parentId(getParentId)
            (meta);

        function getParentId(el, idx, data) {
            if (idx === 0) return null;
            var min = Infinity;
            var minIdx = 0;
            for (var i = idx - 1; i >= 0; i--) {
                const distIdx = indexCalc(i, idx);
                if (distance[distIdx] < min) {
                    min = distance[distIdx];
                    minIdx = i;
                }
            }
            return data[minIdx].name;
        }
    });
};

function getIndexCalculator(n) {
    const triangleN1 = triangle(n - 1);
    return function getIndex(i, j) {
        return triangleN1 - triangle(n - 2 - i) - (n - j);
    };
}

function getIndex(i, j, n) {
    return triangle(n - 1) - triangle(n - 2 - i) - (n - j);
}

function triangle(n) {
    return (n * (n + 1)) / 2;
}
