import lunr from "lunr";

// Adapted from https://john-millikin.com/compacting-lunr-search-indices
export class LunrIndexCompactor {
  /**
   * Compact the given Lunr Index, returning an opque JSON-serializable data structure.
   */
  compactLunrIndex(index: lunr.Index): any {
    const output: any = index.toJSON();
    output.invertedIndex = this.compactInvertedIndex(output);
    output.fieldVectors = this.compactFieldVectors(output);
    return output;
  }

  /**
   * Expand the opaque JSON-serializable data structure returned by compact back into a Lunr Index.
   */
  expandLunrIndex(compactJson: any): lunr.Index {
    const fields = compactJson["fields"];

    const fieldVectors = compactJson["fieldVectors"].map((item: any) => {
      const id = item[0];
      const vectors = item[1];
      let prev: any = null;
      const expanded = vectors.map((v: any, ii: number) => {
        if (ii % 2 === 0) {
          if (v === null) {
            // biome-ignore lint/style/noParameterAssign: <explanation>
            v = prev + 1;
          }
          prev = v;
        }
        return v;
      });
      return [id, expanded];
    });

    const invertedIndex = compactJson["invertedIndex"].map(
      (item: any, itemIdx: number) => {
        const token = item[0];
        const fieldMap: any = { _index: itemIdx };
        fields.forEach((field: any, fieldIdx: number) => {
          const matches: any = {};

          let docRef: any = null;
          item[fieldIdx + 1].forEach((v: any, ii: number) => {
            if (ii % 2 === 0) {
              docRef = fieldVectors[v][0].slice(`${field}/`.length);
            } else {
              matches[docRef] = v;
            }
          });
          fieldMap[field] = matches;
        });
        return [token, fieldMap];
      },
    );

    invertedIndex.sort((a: any, b: any) => {
      if (a[0] < b[0]) {
        return -1;
      }
      if (a[0] > b[0]) {
        return 1;
      }
      return 0;
    });

    return lunr.Index.load({
      version: compactJson["version"],
      fields: fields,
      fieldVectors: fieldVectors,
      invertedIndex: invertedIndex,
      pipeline: compactJson["pipeline"],
    });
  }

  private compactFieldVectors(indexJson: any) {
    return indexJson["fieldVectors"].map((item: any) => {
      const id = item[0];
      const vectors = item[1];
      let prev: any = null;
      const compacted = vectors.map((v: any, ii: number) => {
        if (ii % 2 === 0) {
          if (prev !== null && v === prev + 1) {
            prev += 1;
            return null;
          }
          prev = v;
        }
        return v;
      });
      return [id, compacted];
    });
  }

  private compactInvertedIndex(indexJson: any) {
    const fields = indexJson["fields"];
    const fieldVectorIdxs = new Map(
      indexJson["fieldVectors"].map((v: any, idx: number) => {
        return [v[0], idx];
      }),
    );

    const items = new Map(
      indexJson["invertedIndex"].map((item: any) => {
        const token = item[0];
        const props = item[1];
        const newItem = [token];
        // biome-ignore lint/complexity/noForEach: <explanation>
        fields.forEach((field: any) => {
          const fProps = props[field];
          const matches: any[] = [];
          // biome-ignore lint/complexity/noForEach: <explanation>
          Object.keys(fProps).forEach((docRef) => {
            const fieldVectorIdx = fieldVectorIdxs.get(`${field}/${docRef}`);
            if (fieldVectorIdx === undefined) {
              throw new Error();
            }
            matches.push(fieldVectorIdx);
            matches.push(fProps[docRef]);
          });
          newItem.push(matches);
        });

        return [props["_index"], newItem];
      }),
    );

    const indexes = Array.from(items.keys()).sort(
      // @ts-expect-error Unknown types
      (a, b) => a - b,
    );

    const compacted = Array.from(indexes, (k) => {
      const item = items.get(k);
      if (item === undefined) {
        throw new Error();
      }
      return item;
    });

    return compacted;
  }
}
