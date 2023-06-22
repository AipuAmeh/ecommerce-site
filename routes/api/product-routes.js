const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');


router.get('/', async (req, res) => {
  try {
    const productData = await Product.findAll({
      include: [{ model: Category }, { model: Tag}],
    });
    res.status(200).json(productData);
  } catch (error) {
    res.status(500).json(error);
  }
});


router.get('/:id', async (req, res) => {
  try {
    const productData = await Product.findByPk(req.params.id, {
      include: [{ model: Category }, { model: Tag}]
    });
    res.status(200).json(productData);
  } catch (error) {
    res.status(500).json(error)
  }
});


router.post('/', async (req, res) => {
await Product.create({
  product_name: req.body.product_name,
  price: req.body.price,
  stock: req.body.stock,
  tagId: [req.body.tagId]
})
    .then((product) => {
      // if there's product tags, we need to create pairings to bulk create in the ProductTag model
      if (req.body.tagId.length) {
        const productTagIdArr = req.body.tagId.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          };
        });
        return ProductTag.bulkCreate(productTagIdArr);
      }
      res.status(200).json(product);
    })
    .then((productTagIds) => res.status(200).json(productTagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});


router.put('/:id', async (req, res) => {

 await Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((product) => {

      return ProductTag.findAll({ where: { product_id: req.params.id } });
    })
    .then((productTags) => {

      const productTagIds = productTags.map(({ tag_id }) => tag_id);

      const newProductTags = req.body.tagIds
        .filter((tag_id) => !productTagIds.includes(tag_id))
        .map((tag_id) => {
          return {
            product_id: req.params.id,
            tag_id,
          };
        });
      const productTagsToRemove = productTags
        .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
        .map(({ id }) => id);

      return Promise.all([
        ProductTag.destroy({ where: { id: productTagsToRemove } }),
        ProductTag.bulkCreate(newProductTags),
      ]);
    })
    .then((updatedProductTags) => res.json(updatedProductTags))
    .catch((err) => {
      res.status(400).json(err);
    });
});

router.delete('/:id', async (req, res) => {
 await Product.destroy({
    where: {
      id: req.params.id,
    }
  })
  .then((deletedProduct) => {
    res.json(deletedProduct);
  })
  .catch((err) => {
    res.json(err);
  })
});

module.exports = router;
